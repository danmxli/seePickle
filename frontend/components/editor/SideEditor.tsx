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

const SideEditor: React.FC<SideEditorProps> = ({ nodeData, updateBaseData, openEditor, updateOpenEditor, planId, subtasklist }) => {
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
        AddSubtask: <UserInput planId={planId} nodeData={nodeData} />,
        ViewSubtask: <DisplaySubtasks subtaskItems={localSubtasks} planId={planId} nodeData={nodeData} updateLocalSubtasks={updateLocalSubtasks} />
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
        const userId = localStorage.getItem('userId')
        if (userId === null || userId === 'null') {
            router.push('/'); // Redirect to landing page
        }
        else {
            const requestBody = {
                userId: JSON.parse(userId),
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
    }

    // handle open chat view
    const fetchChatHistory = async () => {
        const userId = localStorage.getItem('userId')
        if (userId === null || userId === 'null') {
            router.push('/'); // Redirect to landing page
        }
        else {
            const requestBody = {
                userId: JSON.parse(userId),
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
    }

    return (
        <div className={`${openEditor ? 'h-screen' : 'h-fit'} overflow-scroll scrollbar-hide fixed bottom-0 right-0 p-2 bg-white border-l-2 border-t-2 rounded-tl-3xl border-teal-800 w-1/3`}>
            {openEditor ? (<>
                <button
                    className="p-1 pl-8 pr-8 border border-2 border-teal-600 text-teal-600 rounded-2xl"
                    onClick={handleCloseEditor}
                >
                    close
                </button>
                <div className="mt-2">
                    <div className="border border-teal-600 text-sm text rounded-2xl">
                        <div className="p-4 max-h-52 font-light overflow-scroll scrollbar-hide">
                            {nodeData}
                        </div>
                        {openChatView ? (
                            <div className="m-2 p-2 pl-4 pr-4 inline-flex bg-teal-600 text-teal-200 rounded-xl flex items-center gap-2">
                                <FaUserAstronaut />AI help and insights
                            </div>
                        ) : (
                            <button
                                className="m-2 p-2 pl-4 pr-4 bg-teal-800 text-teal-200 rounded-xl flex items-center gap-2"
                                onClick={handleOpenChat}
                            >
                                <FaUserAstronaut />AI help and insights
                            </button>
                        )}

                    </div>
                    <button
                        className="mt-2 p-2 pl-4 pr-4 border border-teal-600 rounded-xl text-sm"
                        onClick={viewSubtask}
                    >
                        All subtasks
                    </button>
                    <button
                        className="mt-2 ml-2 p-2 pl-4 pr-4 border border-teal-600 rounded-xl text-sm"
                        onClick={() => {
                            setEditorPhase('AddSubtask')
                        }}
                    >
                        Add subtask
                    </button>
                    {options[editorPhase]}
                </div>
                <ChatView openChatView={openChatView} updateChatView={updateChatView} chatHistory={chatHistory} addMessage={addMessage} planId={planId} taskDescription={nodeData} clearChatHistory={clearChatHistory} />
            </>) : (
                <h1 className="p-4 border border-2 border-teal-600 text-teal-600 rounded-3xl inline-flex">Select a node to add a subtask to.</h1>
            )}
        </div>
    )
}

export default SideEditor