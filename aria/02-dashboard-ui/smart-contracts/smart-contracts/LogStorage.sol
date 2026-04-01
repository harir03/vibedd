// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LogStorage
 * @dev Simple contract to emit events for Off-Chain logging (Immutable Audit Trail)
 */
contract LogStorage {
    
    // Event to log blocked requests.
    // Indexing 'ip' and 'method' allows for basic filtering on block explorers.
    event RequestBlocked(
        string indexed id,
        string indexed ip,
        string indexed method,
        string url,
        string reason,
        uint256 timestamp
    );

    /**
     * @dev Logs a blocked request by emitting an event.
     * @param id Unique Request ID
     * @param ip Client IP Address
     * @param method HTTP Method
     * @param url Request URL
     * @param reason Reason for blocking
     */
    function logBlockedRequest(
        string memory id,
        string memory ip,
        string memory method,
        string memory url,
        string memory reason
    ) public {
        emit RequestBlocked(id, ip, method, url, reason, block.timestamp);
    }
}
