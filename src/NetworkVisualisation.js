import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const NetworkVisualisation = ({ nodes, links }) => {
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [selectedNode, setSelectedNode] = useState(null);
    const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Fonction pour mettre à jour les dimensions
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        // Écouter le redimensionnement de la fenêtre
        window.addEventListener('resize', updateDimensions);

        // Nettoyage de l'effet
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const { width, height } = dimensions;
        const svg = d3.select(svgRef.current);
        svg.attr('width', width).attr('height', height);

        let g = svg.select('g');
        if (g.empty()) {
            g = svg.append('g');
        }

        const zoom = d3.zoom()
            .scaleExtent([1 / 2, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        // Configuration initiale de la simulation, sans spécifier de données
        const simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(50))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(50));

        // Fonction de mise à jour des données de la simulation
        const updateSimulationData = () => {
            // Mise à jour des liens
            const link = g.selectAll('line')
                .data(links, d => `${d.source.id}-${d.target.id}`);
            link.enter().append('line').merge(link)
                .style('stroke', '#aaa')
                .style('stroke-opacity', 0.6);
            link.exit().remove();

            // Mise à jour des nœuds
            const node = g.selectAll('circle')
                .data(nodes, d => d.id);
            node.enter().append('circle').merge(node)
                .attr('r', 5)
                .style('fill', 'blue')
                .on('click', (event, d) => {
                    setSelectedNode(d);
                    setClickPosition({ x: event.pageX, y: event.pageY });
                });
            node.exit().remove();

            // Appliquer les données mises à jour à la simulation
            simulation.nodes(nodes).on('tick', ticked);
            simulation.force('link').links(links);
            simulation.alpha(1).restart();
        };

        // Fonction pour positionner les éléments à chaque tick de la simulation
        const ticked = () => {
            g.selectAll('line')
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            g.selectAll('circle')
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        };

        updateSimulationData();

        // Créez une fonction pour animer les noeuds
        function animateNodes() {
            nodes.forEach((node, i) => {
                // Appliquez une petite perturbation basée sur un simple calcul trigonométrique pour simuler un mouvement organique
                node.fx = node.x + 0.1 * Math.sin(Date.now() / 1000 + i);
                node.fy = node.y + 0.1 * Math.cos(Date.now() / 1000 + i);
            });

            // Appliquez manuellement la logique de tick pour mettre à jour les positions sans réinitialiser la simulation
            simulation.nodes(nodes); // Assurez-vous de remettre à jour les nœuds dans la simulation
            simulation.alpha(0.3).restart(); // Redémarrez la simulation avec une faible alpha pour éviter des mouvements brusques
        }

        // Lancez l'animation des noeuds
        const intervalId = setInterval(animateNodes, 40); // Mettez à jour environ toutes les 40ms pour un mouvement fluide

        return () => {
            clearInterval(intervalId);
            if (simulation) {
                simulation.stop();
            }
        };
    }, [nodes, links, dimensions]); // Exécuter à chaque changement des props `nodes` et `links` et des dimensions

    return (
        <>
            <svg ref={svgRef}></svg>
            {selectedNode && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${clickPosition.x}px`,
                        top: `${clickPosition.y}px`,
                        background: 'white',
                        border: '1px solid black',
                        padding: '10px'
                    }}
                >
                    <p>ID: {selectedNode.id}</p>
                    <button onClick={() => setSelectedNode(null)}>Close</button>
                </div>
            )}
        </>
    );
};

export default NetworkVisualisation;