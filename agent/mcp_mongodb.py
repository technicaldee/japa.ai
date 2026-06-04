"""
MongoDB MCP Server — exposes scholarship data as tools for the Gemini agent.

This MCP server wraps MongoDB operations into callable tools that the ADK
agent can invoke via the Model Context Protocol.
"""

import json
import os
from typing import Any

from pymongo import MongoClient
from pymongo.collection import Collection
from bson.objectid import ObjectId


class MongoDBMCPServer:
    def __init__(self, uri: str | None = None, db_name: str = "japa"):
        self.uri = uri or os.getenv("MONGO_URI", "")
        if not self.uri:
            raise ValueError("MONGO_URI environment variable is required")
        self.db_name = db_name
        self.client: MongoClient | None = None
        self.db: Any | None = None

    def connect(self):
        self.client = MongoClient(self.uri)
        self.db = self.client[self.db_name]
        self.scholarships: Collection = self.db["scholarships"]
        self.profiles: Collection = self.db["userprofiles"]
        print(f"[MCP] Connected to MongoDB: {self.db_name}")

    def disconnect(self):
        if self.client:
            self.client.close()

    def list_tools(self) -> list[dict]:
        return [
            {
                "name": "search_scholarships",
                "description": "Search scholarships by location, degree level, funding, or keyword",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Free-text search"},
                        "location": {"type": "string"},
                        "degreeLevel": {"type": "string"},
                        "funding": {"type": "string"},
                        "limit": {"type": "integer", "default": 20},
                    },
                },
            },
            {
                "name": "get_scholarship_by_id",
                "description": "Get full details of a specific scholarship",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "MongoDB ObjectId"},
                    },
                    "required": ["id"],
                },
            },
            {
                "name": "get_user_profile",
                "description": "Get a user's saved profile/preferences",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "userId": {"type": "string"},
                    },
                    "required": ["userId"],
                },
            },
            {
                "name": "save_user_profile",
                "description": "Save or update a user's profile/preferences",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "userId": {"type": "string"},
                        "nationality": {"type": "string"},
                        "fieldOfStudy": {"type": "string"},
                        "gpa": {"type": "string"},
                        "targetCountries": {"type": "array", "items": {"type": "string"}},
                        "budget": {"type": "string"},
                        "timeline": {"type": "string"},
                        "degreeLevel": {"type": "string"},
                    },
                    "required": ["userId"],
                },
            },
            {
                "name": "get_scholarship_stats",
                "description": "Get aggregate stats about available scholarships",
                "input_schema": {"type": "object", "properties": {}},
            },
        ]

    def execute_tool(self, name: str, args: dict) -> Any:
        method = getattr(self, f"tool_{name}", None)
        if not method:
            raise ValueError(f"Unknown tool: {name}")
        return method(**args)

    def tool_search_scholarships(
        self,
        query: str = "",
        location: str = "",
        degreeLevel: str = "",
        funding: str = "",
        limit: int = 20,
    ) -> list[dict]:
        filter_dict: dict = {"status": "approved"}
        if query:
            filter_dict["$or"] = [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"provider": {"$regex": query, "$options": "i"}},
            ]
        if location:
            filter_dict["location"] = {"$regex": location, "$options": "i"}
        if degreeLevel:
            filter_dict["degreeLevel"] = {"$regex": degreeLevel, "$options": "i"}
        if funding:
            filter_dict["funding"] = {"$regex": funding, "$options": "i"}

        docs = (
            self.scholarships.find(filter_dict)
            .sort("createdAt", -1)
            .limit(limit)
        )
        results = []
        for d in docs:
            d["_id"] = str(d["_id"])
            if "deadline" in d and d["deadline"]:
                d["deadline"] = d["deadline"].isoformat()
            if "createdAt" in d and d["createdAt"]:
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and d["updatedAt"]:
                d["updatedAt"] = d["updatedAt"].isoformat()
            results.append(d)
        return results

    def tool_get_scholarship_by_id(self, id: str) -> dict | None:
        d = self.scholarships.find_one({"_id": ObjectId(id)})
        if d:
            d["_id"] = str(d["_id"])
            if "deadline" in d and d["deadline"]:
                d["deadline"] = d["deadline"].isoformat()
            if "createdAt" in d and d["createdAt"]:
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and d["updatedAt"]:
                d["updatedAt"] = d["updatedAt"].isoformat()
        return d

    def tool_get_user_profile(self, userId: str) -> dict | None:
        d = self.profiles.find_one({"userId": userId})
        if d:
            d["_id"] = str(d["_id"])
        return d

    def tool_save_user_profile(self, userId: str, **kwargs) -> dict:
        self.profiles.update_one(
            {"userId": userId},
            {"$set": kwargs},
            upsert=True,
        )
        return {"status": "ok", "userId": userId}

    def tool_get_scholarship_stats(self) -> dict:
        total = self.scholarships.count_documents({"status": "approved"})
        by_location = list(
            self.scholarships.aggregate([
                {"$match": {"status": "approved"}},
                {"$group": {"_id": "$location", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10},
            ])
        )
        by_degree = list(
            self.scholarships.aggregate([
                {"$match": {"status": "approved"}},
                {"$group": {"_id": "$degreeLevel", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
            ])
        )
        return {
            "total": total,
            "byLocation": [{"location": x["_id"], "count": x["count"]} for x in by_location],
            "byDegree": [{"degree": x["_id"], "count": x["count"]} for x in by_degree],
        }
