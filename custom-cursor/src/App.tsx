import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { TriangleCursor, clickable } from './cursor';

function App() {
  const [count, setCount] = useState(0);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <div className="App" ref={(el) => setContainer(el)} style={{
      position: 'relative',
      cursor: 'none !important',
    }}>
      <div>
        <clickable.a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </clickable.a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {
        container && (
          <TriangleCursor element={container} />
        )
      }
    </div>
  )
}

export default App
