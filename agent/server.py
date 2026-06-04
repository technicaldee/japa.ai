"""
JAPA Agent Web Server — serves the ADK agent via HTTP for backend integration.

The backend cron uses this to visit scholarship pages and determine application requirements.
"""

import asyncio
import json
import os
import urllib.request
import urllib.error
from typing import Any
from html.parser import HTMLParser

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from mcp_mongodb import MongoDBMCPServer

load_dotenv()

app = Flask(__name__)

mcp = MongoDBMCPServer()
session_service = InMemorySessionService()
runner: Runner | None = None

USER_ID = "japa_user"
SESSION_ID = "scholarship_session"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip_tags = {"script", "style", "noscript"}

    def handle_data(self, data):
        self.text.append(data)

    def error(self, message):
        pass


def strip_html(html: str) -> str:
    parser = HTMLTextExtractor()
    parser.feed(html)
    return " ".join(parser.text).strip()


def search_tool(args: dict[str, Any]) -> dict:
    results = mcp.tool_search_scholarships(**args)
    return {"results": results, "count": len(results)}


def get_by_id_tool(args: dict[str, Any]) -> dict:
    result = mcp.tool_get_scholarship_by_id(**args)
    return {"scholarship": result}


def get_profile_tool(args: dict[str, Any]) -> dict:
    result = mcp.tool_get_user_profile(**args)
    return {"profile": result}


def save_profile_tool(args: dict[str, Any]) -> dict:
    result = mcp.tool_save_user_profile(**args)
    return result


def stats_tool(args: dict[str, Any]) -> dict:
    result = mcp.tool_get_scholarship_stats()
    return result


def visit_page_tool(args: dict[str, Any]) -> dict:
    url = args.get("url", "")
    if not url:
        return {"error": "URL required"}

    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; JAPA-Agent/1.0)",
                "Accept": "text/html",
            },
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")
            text = strip_html(html)[:8000]

        title = ""
        import re as re_m

        m = re_m.search(r"<title[^>]*>([^<]*)</title>", html, re_m.IGNORECASE)
        if m:
            title = m.group(1)

        return {"url": url, "title": title, "textContent": text[:8000]}
    except Exception as e:
        return {"error": str(e)}


def analyze_application_tool(args: dict[str, Any]) -> dict:
    page_text = args.get("pageText", "")
    user_profile = args.get("userProfile", "{}")

    if not page_text:
        return {"error": "No page text provided"}

    prompt = f"""You are JAPA, analyzing a scholarship application page.

PAGE CONTENT:
{page_text[:6000]}

USER PROFILE:
{user_profile}

Analyze the page and determine:
1. What application fields are needed
2. Which fields the user can fill from their profile
3. What documents are missing
4. Can the user apply now?

Return JSON:
{{"canApply": bool, "missingDocs": [list], "instructions": "next steps", "scholarshipName": "", "provider": "", "applicationFields": [], "prefilledData": {{}}}}"""

    try:
        req = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}",
            data=json.dumps(
                {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
                }
            ).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            text = (
                result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "{}")
            )
            cleaned = text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
    except Exception as e:
        return {"error": str(e)}


def init_agent():
    global runner
    agent = Agent(
        name="japa_scholarship_agent",
        model="gemini-2.5-flash",
        instruction="""You are JAPA, an AI agent that helps international students find and apply for scholarships.

You have tools to:
1. Search scholarship database
2. View scholarship details
3. Visit external scholarship websites to read application requirements
4. Analyze application pages to determine what's needed
5. Manage user profiles

When helping a user apply:
- First find matching scholarships
- Visit each scholarship's URL to understand requirements
- Check what information the user has vs what's needed
- Report missing documents
- Try to submit applications when possible""",
        tools=[
            search_tool,
            get_by_id_tool,
            get_profile_tool,
            save_profile_tool,
            stats_tool,
            visit_page_tool,
            analyze_application_tool,
        ],
    )
    runner = Runner(
        app_name="japa_agent",
        agent=agent,
        session_service=session_service,
    )
    asyncio.run(
        session_service.create_session(
            app_name="japa_agent",
            user_id=USER_ID,
            session_id=SESSION_ID,
        )
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/visit", methods=["POST"])
def visit():
    data = request.get_json() or {}
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "URL required"}), 400

    if runner is None:
        init_agent()

    result = visit_page_tool({"url": url})
    return jsonify(result)


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json() or {}
    result = analyze_application_tool(
        {"pageText": data.get("pageText", ""), "userProfile": data.get("userProfile", "{}")}
    )
    return jsonify(result)


@app.route("/apply", methods=["POST"])
def apply():
    """Full application flow: visit URL → analyze → report result.

    The ADK agent uses its tools (visit_page, analyze_application) to
    autonomously determine scholarship requirements, check user data,
    and report what's needed.
    """
    data = request.get_json() or {}
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "URL required"}), 400

    if runner is None:
        init_agent()

    page = visit_page_tool({"url": url})
    if "error" in page:
        return jsonify({"success": False, "error": page["error"], "url": url})

    analysis = analyze_application_tool(
        {"pageText": page.get("textContent", ""), "userProfile": data.get("userProfile", "{}")}
    )
    if "error" in analysis:
        return jsonify({"success": False, "error": analysis["error"], "url": url})

    return jsonify({
        "success": analysis.get("canApply", False),
        "url": url,
        "pageTitle": page.get("title", ""),
        "scholarshipName": analysis.get("scholarshipName", ""),
        "provider": analysis.get("provider", ""),
        "canApply": analysis.get("canApply", False),
        "missingDocs": analysis.get("missingDocs", []),
        "instructions": analysis.get("instructions", ""),
        "applicationFields": analysis.get("applicationFields", []),
        "prefilledData": analysis.get("prefilledData", {}),
        "analyzedBy": "google-adk-agent",
        "model": "gemini-2.5-flash",
    })


@app.route("/chat", methods=["POST"])
def chat():
    global runner

    data = request.get_json() or {}
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "Message required"}), 400

    if runner is None:
        init_agent()

    events = runner.run(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=genai_types.Content(
            role="user",
            parts=[genai_types.Part(text=message)],
        ),
    )

    reply = ""
    for event in events:
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    reply = part.text

    return jsonify({"reply": reply or "No response generated."})


@app.route("/tools", methods=["GET"])
def list_tools():
    return jsonify({"tools": mcp.list_tools()})


if __name__ == "__main__":
    print("[JAPA Agent] Connecting to MongoDB...")
    mcp.connect()
    port = int(os.getenv("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
