import React, { useState, useEffect } from 'react';
import NetworkVisualisation from './NetworkVisualisation';

function NetworkData() {
    const [networkData, setNetworkNodes] = useState({ nodes: [], links: [] });

    useEffect(() => {
        // Remplacer 'ws://localhost:8080/ws' par l'URL de votre serveur WebSocket
        const ws = new WebSocket('ws://localhost:8080/ws');

        ws.onopen = () => {
            console.log('Connected to the WebSocket server');
        };

        ws.onmessage = (event) => {
            const rawData = JSON.parse(event.data);
            const nodes = rawData.map(node => ({
                id: node.peerID,
                topicsList: node.topicsList,
                keepRelayConnectionAlive: node.keepRelayConnectionAlive,
                blockAnnouncement: node.blockAnnouncement,
                askingBlockchain: node.askingBlockchain,
                receiveBlockchain: node.receiveBlockchain,
                clientAnnouncement: node.clientAnnouncement,
                storageNodeResponse: node.storageNodeResponse,
                fullNodeAnnouncement: node.fullNodeAnnouncement,
                askMyFilesList: node.askMyFilesList,
                receiveMyFilesList: node.receiveMyFilesList,
            }));

            const linksMap = new Map();
            rawData.forEach(node => {
                node.connectedPeers.forEach(peerID => {
                    const linkKey = node.peerID < peerID ? `${node.peerID}-${peerID}` : `${peerID}-${node.peerID}`;
                    if (!linksMap.has(linkKey)) {
                        linksMap.set(linkKey, { source: node.peerID, target: peerID });
                    }
                });
            });
            const links = Array.from(linksMap.values());

            setNetworkNodes({ nodes, links });
        };

        ws.onclose = () => {
            console.log('Disconnected from the WebSocket server');
        };

        // Nettoyage en cas de démontage du composant
        return () => {
            ws.close();
        };
    }, []); // Ce useEffect ne s'exécutera qu'une fois lors du montage du composant

    // Le rendu reste similaire, adaptez-le selon vos besoins
    return (
        <div>
            <NetworkVisualisation nodes={networkData.nodes} links={networkData.links} />
        </div>
    );
}

export default NetworkData;
