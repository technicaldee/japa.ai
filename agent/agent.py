"""
JAPA Scholarship Agent — built with Google ADK + Gemini + MongoDB MCP.

This is the core hackathon submission. The agent:
1. Uses Gemini (gemini-2.5-flash) for reasoning
2. Calls MongoDB MCP tools to search scholarships and manage user profiles
3. Runs as a web service on Cloud Run
"""

import os
import json
from typing import Any

from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from mcp_mongodb import MongoDBMCPServer

load_dotenv()

APP_NAME = "japa_agent"
USER_ID = "japa_user"
SESSION_ID = "scholarship_session"

mcp = MongoDBMCPServer()


def search_scholarships_tool(args: dict[str, Any]) -> dict:
    """Search scholarships by criteria."""
    results = mcp.tool_search_scholarships(**args)
    return {"results": results, "count": len(results)}


def get_scholarship_by_id_tool(args: dict[str, Any]) -> dict:
    """Get full scholarship details."""
    result = mcp.tool_get_scholarship_by_id(**args)
    return {"scholarship": result}


def get_user_profile_tool(args: dict[str, Any]) -> dict:
    """Get user profile."""
    result = mcp.tool_get_user_profile(**args)
    return {"profile": result}


def save_user_profile_tool(args: dict[str, Any]) -> dict:
    """Save user profile."""
    result = mcp.tool_save_user_profile(**args)
    return result


def get_scholarship_stats_tool(args: dict[str, Any]) -> dict:
    """Get aggregate stats."""
    result = mcp.tool_get_scholarship_stats()
    return result


def create_agent() -> Agent:
    return Agent(
        name="japa_scholarship_agent",
        model="gemini-2.5-flash",
        instruction="""You are JAPA, an AI agent that helps international students find scholarship opportunities abroad.

Your mission:
1. Understand the user's academic background, target countries, budget, and timeline
2. Search available scholarships in MongoDB to find the best matches
3. Provide personalized recommendations with reasoning
4. Help users track application progress and deadlines

Capabilities:
- Search scholarships by location, degree level, funding type, keywords
- View full scholarship details
- Save and update user profiles with preferences
- Get aggregate stats about available opportunities

Always be helpful, specific, and actionable. When recommending scholarships, explain WHY they match.
If the user hasn't shared their profile yet, ask about their field of study, target countries, and budget.""",
        tools=[
            search_scholarships_tool,
            get_scholarship_by_id_tool,
            get_user_profile_tool,
            save_user_profile_tool,
            get_scholarship_stats_tool,
        ],
    )


def run_agent_cli():
    """Run the agent in CLI mode for testing."""
    mcp.connect()
    agent = create_agent()
    session_service = InMemorySessionService()
    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=session_service,
    )
    session = session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )

    print("JAPA Scholarship Agent ready! Type your questions (or 'quit' to exit).")
    print("Example: 'Find me PhD scholarships in Germany'")
    print()

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ("quit", "exit"):
            break

        events = runner.run(
            user_id=USER_ID,
            session_id=SESSION_ID,
            new_message=genai_types.Content(
                role="user",
                parts=[genai_types.Part(text=user_input)],
            ),
        )

        for event in events:
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        print(f"\nAgent: {part.text}\n")


if __name__ == "__main__":
    run_agent_cli()
