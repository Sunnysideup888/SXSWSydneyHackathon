import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';

const DependencyGraph = () => {
  const { projectId, ticketId } = useParams();
  const navigate = useNavigate();
  const [dependencyData, setDependencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const fetchDependencyGraph = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/tickets/${ticketId}/dependency-graph`);
        if (!response.ok) {
          throw new Error('Failed to fetch dependency graph');
        }
        const data = await response.json();
        setDependencyData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchDependencyGraph();
    }
  }, [ticketId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: Math.max(800, container.offsetWidth - 100),
          height: Math.max(600, window.innerHeight - 200)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build graph data for D3
  const buildGraphData = () => {
    if (!dependencyData) return { nodes: [], links: [] };

    const nodes = new Map();
    const links = [];

    // Add current ticket
    nodes.set(dependencyData.ticket.id, {
      id: dependencyData.ticket.id,
      title: dependencyData.ticket.title,
      status: dependencyData.ticket.status,
      type: 'main',
      isMain: true
    });

    // Process upstream dependencies with correct parent tracking
    const processUpstreamDependencies = (deps, parentTicketId = null) => {
      deps.forEach(dep => {
        const ticketId = dep.dependsOnTicketId;
        
        // Add node if not exists
        if (!nodes.has(ticketId)) {
          nodes.set(ticketId, {
            id: ticketId,
            title: dep.dependsOnTitle,
            status: dep.dependsOnStatus,
            type: 'upstream',
            isMain: false
          });
        }

        // Add link - this ticket depends on its parent
        // The source is the dependency, target is what depends on it
        const targetId = parentTicketId || dependencyData.ticket.id;
        links.push({
          source: ticketId,  // The dependency (what must be done first)
          target: targetId,  // What depends on it (what comes after)
          type: 'depends'
        });

        // Process nested dependencies - pass this ticket as the parent
        if (dep.dependencies && dep.dependencies.length > 0) {
          processUpstreamDependencies(dep.dependencies, ticketId);
        }
      });
    };

    // Process downstream dependents
    const processDownstreamDependents = (deps, parentTicketId = null) => {
      deps.forEach(dep => {
        const ticketId = dep.dependentTicketId;
        
        // Add node if not exists
        if (!nodes.has(ticketId)) {
          nodes.set(ticketId, {
            id: ticketId,
            title: dep.dependentTitle,
            status: dep.dependentStatus,
            type: 'downstream',
            isMain: false
          });
        }

        // Add link - this ticket depends on the main ticket
        // The source is what depends on it, target is the dependency
        const sourceId = parentTicketId || dependencyData.ticket.id;
        links.push({
          source: sourceId,  // What depends on it (what comes after)
          target: ticketId,  // The dependency (what must be done first)
          type: 'depends'
        });

        // Process nested dependents
        if (dep.dependents && dep.dependents.length > 0) {
          processDownstreamDependents(dep.dependents, ticketId);
        }
      });
    };

    // Process upstream dependencies
    if (dependencyData.allUpstreamDependencies) {
      processUpstreamDependencies(dependencyData.allUpstreamDependencies);
    }

    // Process downstream dependents
    if (dependencyData.allDownstreamDependents) {
      processDownstreamDependents(dependencyData.allDownstreamDependents);
    }

    return {
      nodes: Array.from(nodes.values()),
      links: links
    };
  };

  // Create D3 force simulation
  useEffect(() => {
    if (!dependencyData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const { nodes, links } = buildGraphData();

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(80));

    // Create arrow markers for links
    svg.append("defs").selectAll("marker")
      .data(["dependency"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#666");

    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#666")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#dependency)");

    // Create nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add node rectangles
    node.append("rect")
      .attr("width", 140)
      .attr("height", 80)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("x", -70)
      .attr("y", -40)
      .attr("fill", d => d.isMain ? "#fef2f2" : "#ffffff")
      .attr("stroke", d => d.isMain ? "#dc2626" : "#d1d5db")
      .attr("stroke-width", d => d.isMain ? 2 : 1)
      .style("filter", d => d.isMain ? "drop-shadow(0 4px 8px rgba(220, 38, 38, 0.3))" : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))");

    // Add node text
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -10)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", "#374151")
      .text(d => d.title.length > 15 ? d.title.substring(0, 15) + "..." : d.title);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "10px")
      .attr("fill", "#6b7280")
      .text(d => `ID: ${d.id}`);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 20)
      .attr("font-size", "10px")
      .attr("fill", "#6b7280")
      .text(d => d.status);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [dependencyData, dimensions]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dependency graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!dependencyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No dependency data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dependency Graph
          </h1>
          <p className="text-gray-600">
            Ticket: {dependencyData.ticket.title} (ID: {dependencyData.ticket.id})
          </p>
          
          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <div className="text-blue-800 font-semibold">Upstream</div>
              <div className="text-blue-600 text-lg">{dependencyData.summary.totalUpstream}</div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <div className="text-green-800 font-semibold">Downstream</div>
              <div className="text-green-600 text-lg">{dependencyData.summary.totalDownstream}</div>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <div className="text-orange-800 font-semibold">Direct Deps</div>
              <div className="text-orange-600 text-lg">{dependencyData.summary.directDependenciesCount}</div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <div className="text-purple-800 font-semibold">Direct Deps On</div>
              <div className="text-purple-600 text-lg">{dependencyData.summary.directDependentsCount}</div>
            </div>
          </div>
        </div>


        {/* Legend */}
        <div className="mb-6 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-300 rounded mr-2 border border-red-400"></div>
            <span className="font-medium">Current Ticket (Highlighted)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded mr-2"></div>
            <span>Dependencies</span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl mr-2">→</span>
            <span>Dependency Flow</span>
          </div>
        </div>

        {/* Interactive Force-Directed Graph */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Interactive Dependency Graph
          </div>
          <div className="text-sm text-gray-600 text-center mb-4">
            Drag nodes to move them around • Nodes automatically arrange themselves
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{ display: 'block' }}
            />
          </div>

          {/* Controls */}
          {/* <div className="mt-4 flex justify-center space-x-4">
            <button
              onClick={() => {
                if (svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  const simulation = svg.datum().simulation;
                  if (simulation) {
                    simulation.alpha(1).restart();
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Restart Animation
            </button>
            <button
              onClick={() => {
                if (svgRef.current) {
                  const svg = d3.select(svgRef.current);
                  const nodes = svg.selectAll("g").data();
                  nodes.forEach(node => {
                    node.fx = null;
                    node.fy = null;
                  });
                  const simulation = svg.datum().simulation;
                  if (simulation) {
                    simulation.alpha(0.3).restart();
                  }
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🎯 Auto Arrange
            </button>
          </div> */}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            ← Back to Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default DependencyGraph;
