import React, { useState, useEffect } from 'react';
import NetworkVisualisation from './NetworkVisualisation';

function NetworkData() {
    const [networkData, setNetworkData] = useState({ nodes: [], links: [] });

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080/ws');

        ws.onopen = () => {
            console.log('Connected to the WebSocket server');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch(message.type) {
                case 'initData':
                    // Initialisation avec les données complètes
                    processInitData(message.data);
                    break;
                case 'dataUpdate':
                    // Mise à jour avec les différences
                    processDiffData(message.data);
                    console.log('Data update:', message.data);
                    break;
                default:
                    console.log('Unknown message type');
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from the WebSocket server');
        };

        // Cleanup function
        return () => {
            ws.close();
        };
    }, []);

    const processInitData = (data) => {
        const nodes = data.map(node => ({
            id: node.peerID,
            connectedPeers: node.connectedPeers,
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

        const links = [];
        data.forEach(node => {
            node.connectedPeers.forEach(peerID => {
                const linkKey = node.peerID < peerID ? `${node.peerID}-${peerID}` : `${peerID}-${node.peerID}`;
                if (!links.find(link => link.source === linkKey.split('-')[0] && link.target === linkKey.split('-')[1])) {
                    links.push({ source: node.peerID, target: peerID });
                }
            });
        });

        setNetworkData({ nodes, links });
    };

    const processDiffData = (diffData) => {
        setNetworkData(current => {
            let newNodes = [...current.nodes];
            let newLinks = [...current.links];
            
            // Gérer l'ajout de nouveaux nœuds
            diffData.added?.forEach(addedNode => {
                if (!newNodes.some(node => node.id === addedNode.peerID)) {
                    newNodes.push({
                        id: addedNode.peerID,
                        connectedPeers: addedNode.connectedPeers,
                    });
    
                    // Ajouter les liens pour le nouveau nœud
                    addedNode.connectedPeers.forEach(peerID => {
                        if (newNodes.some(node => node.id === peerID)) {
                            newLinks.push({ source: addedNode.peerID, target: peerID });
                        }
                    });
                }
            });
    
            // Gérer la mise à jour des nœuds
            diffData.updated?.forEach(updatedNode => {
                // Trouver l'index du nœud à mettre à jour
                const nodeIndex = newNodes.findIndex(node => node.id === updatedNode.peerID);
                console.log('Updated node:', updatedNode.peerID);
                if (nodeIndex !== -1) {
                    // Remplacer le nœud par sa nouvelle version
                    newNodes[nodeIndex] = {
                        ...newNodes[nodeIndex], // Conserver les propriétés existantes
                        // Mettre à jour avec les nouvelles valeurs
                        id: updatedNode.peerID,
                        connectedPeers: updatedNode.connectedPeers,
                    };
    
                    // Mettre à jour les liens si nécessaire
                    const existingLinks = newLinks.filter(link => link.source === updatedNode.peerID || link.target === updatedNode.peerID);
                    if (existingLinks.length > 0) {
                        // Supprimer les anciens liens
                        newLinks = newLinks.filter(link => link.source !== updatedNode.peerID && link.target !== updatedNode.peerID);
                        
                        // Ajouter les nouveaux liens basés sur updatedNode.connectedPeers
                        updatedNode.connectedPeers.forEach(peerID => {
                            newLinks.push({ source: updatedNode.peerID, target: peerID });
                        });
                    }
                }
            });

            // Gérer la suppression de nœuds
            diffData.removed?.forEach(removedNode => {
                newNodes = newNodes.filter(node => node.id !== removedNode.peerID); // Supprimer le nœud
            });
    
            // Reconstruire les liens à partir des nœuds restants, comme avant
            let rebuiltLinks = [];
            newNodes.forEach(node => {
                node.connectedPeers.forEach(peerID => {
                    if (newNodes.some(n => n.id === peerID)) {
                        const linkKey = node.id < peerID ? `${node.id}-${peerID}` : `${peerID}-${node.id}`;
                        if (!rebuiltLinks.some(link => `${link.source}-${link.target}` === linkKey)) {
                            rebuiltLinks.push({ source: node.id, target: peerID });
                        }
                    }
                });
            });

            return { nodes: newNodes, links: rebuiltLinks };
        });
    };

    return (
        <div>
            <h2>Online peers : {networkData.nodes.length} - Connections : {networkData.links.length}</h2>
            <NetworkVisualisation nodes={networkData.nodes} links={networkData.links} />
        </div>
    );
}

export default NetworkData;
