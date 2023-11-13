from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
import os
from uuid import uuid4
from flask import Blueprint, jsonify, request
from data.generate import base_chat_generate

load_dotenv('.env')
client = MongoClient(os.getenv("MONGODB_URI"))
db = client['AppData']
UserInfo = db['UserInfo']

chat_blueprint = Blueprint('chat', __name__)


@chat_blueprint.route("/", methods=["POST"])
def create_subtask():
    data = request.get_json()
    userId = data.get("userId")
    planId = data.get('planId')
    taskDescription = data.get('taskDescription')
    prompt = data.get("prompt")
    response = ''

    user = UserInfo.find_one({"_id": userId})
    if user:
        all_plans = user.get("plans", [])

        # find matching plan for planId
        res = next((plan for plan in all_plans if plan['_id'] == planId), None)
        if res is None:
            return (jsonify({
                "userId": userId,
                "message": "not found"
            }))

        # find matching base task
        base_task = next(
            (task for task in res["base_tasks"] if task["description"] == taskDescription))
        if base_task is None:
            return (jsonify({
                "userId": userId,
                "message": "not found"
            }))

        # filter to identify the document
        filter = {
            "_id": userId,
            "plans._id": planId,
            "plans.base_tasks.description": taskDescription
        }
        # Array filter to identify the specific base_task
        array_filters = [
            {"plan._id": planId},
            {"task.description": taskDescription}
        ]

        response = base_chat_generate(prompt)

        updateChatHistory = {
            "$push": {
                "plans.$[plan].base_tasks.$[task].chat_history": [
                    {
                        "role": "user",
                        "message": prompt
                    },
                    {
                        "role": "bot",
                        "message": response
                    }
                ]
            }
        }

        result = UserInfo.update_one(
            filter, updateChatHistory, array_filters=array_filters)
        if result:
            return (jsonify({
                "userId": userId,
                "chat_logs": [
                    {
                        "role": "user",
                        "message": prompt
                    },
                    {
                        "role": "bot",
                        "message": response
                    }
                ]
            }))
        else:
            return (jsonify({
                "userId": userId,
                "chat_logs": "error updating one"
            }))
    else:
        return (jsonify({
            "userId": userId,
            "chat_logs": "not found"
        }))