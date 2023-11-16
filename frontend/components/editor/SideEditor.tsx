import { useRouter } from "next/navigation";
import React, { useState, useEffect, MouseEventHandler } from "react";
import { FaUserAstronaut } from 'react-icons/fa'
import UserInput from "./UserInput";
import DisplaySubtasks from "./DisplaySubtasks";
import ChatView from "../playground/ChatView";

interface Task {
    description: string;
    order: string;
    sub_tasks: any[]
}

interface SideEditorProps {
    user: any
    nodeData: any
    updateBaseData: (newData: Task[]) => void;
    openEditor: boolean
    updateOpenEditor: (isOpen: boolean, newData: any, newSubtasks: any) => void;
    planId: string
    subtasklist: {
        _id: string;
        description: string;
    }[]

}

interface Message {
    message: string
    role: string
}

const SideEditor: React.FC<SideEditorProps> = ({ user, nodeData, updateBaseData, openEditor, updateOpenEditor, planId, subtasklist }) => {
    const router = useRouter()
    const [localSubtasks, setLocalSubtasks] = useState([...subtasklist])
    useEffect(() => {
        // update localSubtasks when subtasklist change
        setLocalSubtasks([...subtasklist]);
    }, [subtasklist]);

    const updateLocalSubtasks = (newLocalSubtask: {
        _id: string;
        description: string;
    }[]) => {
        setLocalSubtasks(newLocalSubtask)
    }

    // sideEditor phases interface
    interface sideEditorPhases {
        [key: string]: React.ReactNode;
    }

    // phases are 'Fetching' 'ViewSubtask'
    const [editorPhase, setEditorPhase] = useState('ViewSubtask')

    // chat view update state function
    const [openChatView, setOpenChatView] = useState(false)
    const updateChatView = (isOpen: boolean) => {
        setOpenChatView(isOpen)
    }
    useEffect(() => {
        updateChatView(false)
    }, [nodeData])

    // close the editor
    const handleCloseEditor: MouseEventHandler<HTMLButtonElement> = () => {
        updateChatView(false)
        updateOpenEditor(false, null, null)
    };

    // open chat view
    const handleOpenChat: MouseEventHandler<HTMLButtonElement> = () => {
        fetchChatHistory()
    }

    // define object of phases
    const options: sideEditorPhases = {
        AddSubtask: <UserInput user={user} planId={planId} nodeData={nodeData} />,
        ViewSubtask: <DisplaySubtasks user={user} subtaskItems={localSubtasks} planId={planId} nodeData={nodeData} updateLocalSubtasks={updateLocalSubtasks} />
    }

    // chat history state, funct to add messages to the chat history
    const [chatHistory, setChatHistory] = useState<Message[]>([])
    const addMessage = (newMessage: Message) => {
        setChatHistory((prevChatHistory) => [...prevChatHistory, newMessage]);
    };
    const clearChatHistory = () => {
        setChatHistory([])
    }

    // handle view subtask
    const viewSubtask = async () => {
        const requestBody = {
            email: user.email,
            planId: planId,
            taskDescription: nodeData
        }
        console.log(requestBody)

        try {
            const response = await fetch('http://127.0.0.1:3000/planning/all_subtasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    console.log(data["subtasks"])
                    setLocalSubtasks(data["subtasks"])
                    setEditorPhase('ViewSubtask')
                }
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Fetch request error:', error);
        }
    }

    // handle open chat view
    const fetchChatHistory = async () => {
        const requestBody = {
            email: user.email,
            planId: planId,
            taskDescription: nodeData,
            action: "view"
        }
        try {
            const response = await fetch('http://127.0.0.1:3000/chat/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    console.log(data["history"])
                    setChatHistory(data["history"])
                    updateChatView(true)
                }
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Fetch request error:', error);
        }
    }

    return (
        <div className={`${openEditor ? 'h-screen' : 'h-fit rounded-tl-3xl border-t-2'} overflow-scroll scrollbar-hide fixed bottom-0 right-0 p-2 bg-white border-l-2 border-teal-800 w-1/3`}>
            {openEditor ? (<>
                <button
                    className="p-2 pl-8 pr-8 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-2xl text-xs"
                    onClick={handleCloseEditor}
                >
                    close
                </button>
                <div className="mt-2">
                    <div className="border border-gray-300 shadow text-sm text rounded-2xl">
                        <div className="p-4 max-h-52 font-light overflow-scroll scrollbar-hide">
                            {nodeData}
                        </div>
                        <div className="flex gap-1 ml-2 mr-2 mb-2">
                            <button
                                className="p-2 pl-4 pr-4 bg-gray-500 hover:bg-gray-400 text-gray-100 rounded-xl text-sm"
                                onClick={viewSubtask}
                            >
                                All subtasks
                            </button>
                            <button
                                className="p-2 pl-4 pr-4 bg-gray-500 hover:bg-gray-400 text-gray-100 rounded-xl text-sm"
                                onClick={() => {
                                    setEditorPhase('AddSubtask')
                                }}
                            >
                                Add subtask
                            </button>
                            {openChatView ? (
                                <div className="p-2 pl-4 pr-4 inline-flex text-center bg-teal-600 text-teal-200 rounded-xl flex items-center gap-2">
                                    <FaUserAstronaut />AI help and insights
                                </div>
                            ) : (
                                <button
                                    className="p-2 pl-4 pr-4 bg-teal-800 hover:bg-teal-600 text-teal-100 rounded-xl flex items-center gap-2"
                                    onClick={handleOpenChat}
                                >
                                    <FaUserAstronaut />AI help and insights
                                </button>
                            )}
                        </div>
                    </div>
                    {options[editorPhase]}
                </div>
                <ChatView user={user} openChatView={openChatView} updateChatView={updateChatView} chatHistory={chatHistory} addMessage={addMessage} planId={planId} taskDescription={nodeData} clearChatHistory={clearChatHistory} />
            </>) : (
                <h1 className="p-4 border-2 border-black bg-gray-200 rounded-3xl inline-flex"><code>Select a node to add a subtask to.</code></h1>
            )}
        </div>
    )
}

export default SideEditor