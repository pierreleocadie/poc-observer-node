import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const BlockchainVisualisation = ({ blocks, chains }) => {
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const { width, height } = dimensions;

        // Construct the graph for ELK
        const nodes = Object.keys(blocks).map(key => ({
            id: key,
            width: 100, // Width of the block
            height: 60,  // Height of the block
        }));

        const edges = chains
            .map(chain => ({
                id: `edge-${chain.currentHash}`,
                sources: [chain.currentHash],
                targets: [chain.previousHash]
            }))
            .filter(edge => blocks[edge.sources[0]] && blocks[edge.targets[0]]); // Ensure both source and target exist

        const graph = {
            id: "root",
            children: nodes,
            edges: edges,
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.direction': "DOWN"
            }
        };

        elk.layout(graph).then(layout => {
            const svg = d3.select(svgRef.current)
                .attr('width', width)
                .attr('height', height);
            
            const zoom = d3.zoom()
                .scaleExtent([0.5, 2])
                .on("zoom", (event) => svg.selectAll('g').attr("transform", event.transform));
            
            svg.call(zoom);
            
            svg.selectAll("*").remove();
            const g = svg.append("g");

            g.selectAll("line")
                .data(layout.edges)
                .enter()
                .append("line")
                .attr("x1", d => layout.children.find(n => n.id === d.sources[0]).x + 50)
                .attr("y1", d => layout.children.find(n => n.id === d.sources[0]).y + 30)
                .attr("x2", d => layout.children.find(n => n.id === d.targets[0]).x + 50)
                .attr("y2", d => layout.children.find(n => n.id === d.targets[0]).y + 30)
                .attr("stroke", "black");

            g.selectAll("rect")
                .data(layout.children)
                .enter()
                .append("rect")
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .attr("width", d => d.width)
                .attr("height", d => d.height)
                .attr("fill", "lightblue")
                .attr("stroke", "black");

            g.selectAll("text")
                .data(layout.children)
                .enter()
                .append("text")
                .attr("x", d => d.x + 50)
                .attr("y", d => d.y + 35)
                .attr("text-anchor", "middle")
                .text(d => `Block ${blocks[d.id].height}`);
        });
    }, [blocks, chains, dimensions]);

    return <svg ref={svgRef}></svg>;
};

export default BlockchainVisualisation;
