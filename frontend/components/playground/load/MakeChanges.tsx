import React from "react"
import ChangeBaseTasks from "./makechanges/ChangeBaseTasks";
import { IoLink } from "react-icons/io5";
import { FaUserAstronaut } from "react-icons/fa"

// base data object structure
interface Task {
    description: string;
    order: string;
    sub_tasks: any[];
}
interface Doc {
    title: string
    url: string
}

interface LoadingPlanProps {
    user: any
    planPrompt: string;
    promptType: string;

    // data from Load
    rawResponse: string;
    baseTasks: Task[];
    resources: Doc[];

    // function to update planCreationState
    updatePlanCreationState: (newState: string) => void;

    // function to update baseTasks, resources, rawResponse
    updateLocalRawResponse: (newRawResponse: string) => void;
    updateLocalTasks: (newTasks: Task[]) => void;
    updateLocalResources: (newResources: Doc[]) => void;
    editTask: (selectedTask: Task) => void;

    // update functions
    updatePhase: (newPhase: string) => void;
    updatePlanHistory: (newHistory: Array<{ _id: string, description: string, prompt_type: string }>) => void;
    updateBaseData: (newData: Task[]) => void;
    updatePlanId: (newId: string) => void;
    updateBaseResources: (newResource: Doc[]) => void;
    updateTokenCount: (newCount: number) => void;
}

const MakeChanges: React.FC<LoadingPlanProps> = ({ user, planPrompt, promptType, rawResponse, baseTasks, resources, updatePlanCreationState, updateLocalRawResponse, updateLocalTasks, updateLocalResources, editTask, updatePhase, updatePlanHistory, updateBaseData, updatePlanId, updateBaseResources, updateTokenCount }) => {

    const createBasePlan = async () => {
        const requestBody = {
            email: user.email,
            prompt: planPrompt,
            prompt_type: promptType,
            task_list: baseTasks,
            resource_list: resources
        }
        console.log(requestBody)
        try {
            const response = await fetch('https://seepickle-production.up.railway.app/planning/base', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    if (data["message"] === "not enough tokens") {
                        updatePhase('OutOfTokens')
                    }
                    else {
                        updateBaseData(data["base_plan"])
                        updateBaseResources(data["resources"])
                        updatePlanId(data["base_id"])
                        updatePlanHistory(data["history"])
                        updatePhase('EditPlan')
                    }
                }
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Fetch request error:', error);
        }
    }

    const regeneratePlan = async () => {
        const requestBody = {
            email: user.email,
            prompt: planPrompt,
            prompt_type: promptType
        }
        console.log(requestBody)
        updatePlanCreationState('Load')
        try {
            const response = await fetch('https://seepickle-production.up.railway.app/loading/base', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    if (data["message"] === "not enough tokens") {
                        updatePhase('OutOfTokens')
                    }
                    else {
                        console.log(data)
                        updateLocalRawResponse(data["raw_text"])
                        updateLocalTasks(data["base_tasks"])
                        updateLocalResources(data["resources"])
                        updateTokenCount(data["tokens"])
                        updatePlanCreationState('MakeChanges')
                    }

                }
            } else {
                console.error('Request failed with status:', response.status);
            }
        } catch (error) {
            console.error('Fetch request error:', error);
        }
    }

    return (
        <div className="h-full overflow-scroll scrollbar-hide">
            <div className="p-8 pt-0 m-4 border border-2 border-teal-800 rounded-3xl h-full overflow-scroll scrollbar-hide">
                <div className="sticky top-0 pt-6 bg-white border-b border-gray-300 flex items-center gap-3">
                    <h1 className="p-2 pl-8 pr-8 bg-teal-900 text-teal-200 max-w-2xl overflow-scroll scrollbar-hide rounded-xl">&#34;{planPrompt}&#34;</h1>
                    <button
                        className="p-2 pl-8 pr-8 border border-gray-300 hover:bg-gray-100 rounded-xl mt-3 mb-3"
                        onClick={() => {
                            createBasePlan()
                        }}
                    >
                        Create Plan
                    </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-8">
                    <div>
                        <div className="p-12 bg-gray-100 rounded-3xl">
                            {baseTasks.length > 0 ? (
                                <>
                                    <ChangeBaseTasks baseTasks={baseTasks} updateLocalTasks={updateLocalTasks} editTask={editTask} />
                                </>

                            ) : (<></>)}
                            {resources.length > 0 ? (
                                <div className="mt-3 space-y-3 p-3 bg-white rounded-xl shadow-lg">
                                    {resources.map((resource, index) => (
                                        <div key={index} >
                                            <a href={resource.url} className="text-sm">

                                                <div className="border text-gray-500 hover:border-teal-400 hover:text-black p-2 rounded-xl break-words">
                                                    <IoLink />{resource.title}
                                                </div>
                                            </a>
                                        </div>
                                    ))}
                                </div>) : (<></>)}
                        </div>
                    </div>

                    <div>
                        <div className="sticky top-32 p-12 border border-gray-300 rounded-3xl shadow-lg ">
                            <div className="h-96 overflow-scroll scrollbar-hide">
                                <p className="whitespace-break-spaces font-light">
                                    {rawResponse}
                                </p>
                            </div>
                            <button className="mt-12 p-2 pl-8 pr-8 flex items-center gap-3 border border-gray-300 hover:bg-gray-100 rounded-xl"
                                onClick={() => {
                                    regeneratePlan()
                                }}
                            >
                                <FaUserAstronaut />Regenerate Response
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default MakeChanges