import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const palette = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#f97316', '#8b5cf6']

function colorForType(type = '') {
  let hash = 0
  for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function buildLayout(graph) {
  const nodes = graph?.nodes || []
  const edges = graph?.edges || []

  // Center the diagram on whichever node has the most connections,
  // since the LLM doesn't reliably label a node's type as "builder".
  const degree = {}
  edges.forEach(e => {
    degree[e.source] = (degree[e.source] || 0) + 1
    degree[e.target] = (degree[e.target] || 0) + 1
  })
  const centerId = nodes.reduce((best, n) =>
    (degree[n.id] || 0) > (degree[best] || 0) ? n.id : best, nodes[0]?.id)
  const others = nodes.filter(n => n.id !== centerId)

  const flowNodes = nodes.map((n) => {
    const isCenter = n.id === centerId
    let position
    if (isCenter) {
      position = { x: 250, y: 180 }
    } else {
      const i = others.findIndex(o => o.id === n.id)
      const angle = (i / Math.max(others.length, 1)) * 2 * Math.PI
      position = { x: 250 + Math.cos(angle) * 200, y: 180 + Math.sin(angle) * 160 }
    }
    return {
      id: n.id,
      position,
      data: { label: n.label },
      style: {
        background: colorForType(n.type),
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 600,
        padding: '8px 12px',
      },
    }
  })

  const flowEdges = edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.relation,
    labelStyle: { fontSize: '10px', fill: '#78716c' },
    style: { stroke: '#d6d3d1' },
  }))

  return { flowNodes, flowEdges }
}

function FraudGraph({ graph }) {
  const { flowNodes, flowEdges } = buildLayout(graph)

  return (
    <div style={{ height: 260 }} className="rounded-xl overflow-hidden border border-stone-100">
      <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
        <Background gap={16} color="#e7e5e4" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

export default FraudGraph
