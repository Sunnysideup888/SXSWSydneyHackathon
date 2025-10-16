import { useState } from 'react'

function App() {
    const [tasks, setTasks] = useState([])
    const [msg, setMsg] = useState("Loading...")

  return (
    <>
        <div className={"flex flex-row bg-amber-50 justify-around"}>
            <div>
                Hello
            </div>
            <div>
                World
            </div>
        </div>
    </>
  )
}

export default App
