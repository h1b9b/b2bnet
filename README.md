# B2BNet

B2BNet is a TypeScript library that enables peer-to-peer (P2P) networking directly between web browsers. It likely leverages technologies like WebRTC and WebTorrent to facilitate this direct browser-to-browser communication.

## Architecture Overview

```mermaid
sequenceDiagram
    participant UserApp
    participant B2BNet
    participant WalletService
    participant EncodingService
    participant PeerService
    participant RpcService
    participant RequestBuilder
    participant Router
    participant WebTorrentService
    participant WireExtension
    participant Controller

    %% 1. B2BNet Initialization
    UserApp->>B2BNet: new B2BNet(config)
    activate B2BNet
    B2BNet->>WalletService: new WalletService()
    activate WalletService
    WalletService-->>B2BNet: instance
    deactivate WalletService
    B2BNet->>EncodingService: new EncodingService()
    activate EncodingService
    EncodingService-->>B2BNet: instance
    deactivate EncodingService
    B2BNet->>PeerService: new PeerService()
    activate PeerService
    PeerService-->>B2BNet: instance
    deactivate PeerService
    B2BNet->>RpcService: new RpcService()
    activate RpcService
    RpcService-->>B2BNet: instance
    deactivate RpcService
    B2BNet->>RequestBuilder: new RequestBuilder()
    activate RequestBuilder
    RequestBuilder-->>B2BNet: instance
    deactivate RequestBuilder
    B2BNet->>Router: new Router(services)
    activate Router
    Router-->>B2BNet: instance
    deactivate Router
    B2BNet->>WebTorrentService: new WebTorrentService(config)
    activate WebTorrentService
    WebTorrentService-->>B2BNet: instance
    deactivate WebTorrentService
    B2BNet-->>UserApp: B2BNet instance
    deactivate B2BNet

    %% 2. Outbound Message Flow (e.g., sending a simple message)
    UserApp->>B2BNet: sendMessage(peerId, message)
    activate B2BNet
    B2BNet->>RequestBuilder: createMessageRequest(message)
    activate RequestBuilder
    RequestBuilder->>EncodingService: encode(request)
    activate EncodingService
    EncodingService-->>RequestBuilder: encodedRequest
    deactivate EncodingService
    RequestBuilder-->>B2BNet: builtRequest
    deactivate RequestBuilder
    B2BNet->>WebTorrentService: send(peerId, builtRequest)
    activate WebTorrentService
    Note over WebTorrentService: Uses WebRTC data channel
    WebTorrentService-->>B2BNet: success/failure
    deactivate WebTorrentService
    B2BNet-->>UserApp: result
    deactivate B2BNet

    %% 3. Inbound Message Flow
    WebTorrentService->>WireExtension: onMessage(encodedData)
    activate WireExtension
    WireExtension->>Router: handleMessage(encodedData, peerId)
    deactivate WireExtension
    activate Router
    Router->>EncodingService: decode(encodedData)
    activate EncodingService
    EncodingService-->>Router: decodedMessage
    deactivate EncodingService
    Router->>RequestParser: parse(decodedMessage)
    activate RequestParser
    RequestParser-->>Router: requestObject (e.g., MessageRequest)
    deactivate RequestParser
    Router->>PeerService: sawPeer(peerId)
    activate PeerService
    PeerService-->>Router: Peer status updated
    deactivate PeerService
    Router->>Controller: process(requestObject, peerId)
    Note over Router,Controller: e.g., MessageController.process()
    activate Controller
    Controller-->>Router: result
    deactivate Controller
    Router-->>WebTorrentService: (ack/response if needed)
    deactivate Router

    %% 4. Outbound RPC Call
    UserApp->>B2BNet: callRpc(peerId, method, params)
    activate B2BNet
    B2BNet->>PeerService: getPeer(peerId)
    activate PeerService
    PeerService-->>B2BNet: peerInfo
    deactivate PeerService
    B2BNet->>RpcService: registerCallback(requestId, callback)
    activate RpcService
    RpcService-->>B2BNet: Callback registered
    deactivate RpcService
    B2BNet->>RequestBuilder: createRpcCallRequest(method, params, requestId)
    activate RequestBuilder
    RequestBuilder->>EncodingService: encode(request)
    activate EncodingService
    EncodingService-->>RequestBuilder: encodedRequest
    deactivate EncodingService
    RequestBuilder-->>B2BNet: builtRequest
    deactivate RequestBuilder
    B2BNet->>WebTorrentService: send(peerId, builtRequest)
    activate WebTorrentService
    WebTorrentService-->>B2BNet: success/failure
    deactivate WebTorrentService
    B2BNet-->>UserApp: (promise for RPC response)
    deactivate B2BNet

    %% 5. Inbound RPC Call Handling (Peer receives RPC call)
    WireExtension->>Router: handleMessage(encodedRpcCall, peerId)
    activate Router
    Router->>EncodingService: decode(encodedRpcCall)
    activate EncodingService
    EncodingService-->>Router: decodedRpcCall
    deactivate EncodingService
    Router->>RequestParser: parse(decodedRpcCall)
    activate RequestParser
    RequestParser-->>Router: rpcCallRequest
    deactivate RequestParser
    Router->>Controller: process(rpcCallRequest, peerId)
    Note over Router,Controller: Specifically RPCCallController
    activate Controller
    Controller->>RpcService: callApi(method, params, requestId, peerId)
    activate RpcService
    Note over RpcService,UserApp: RpcService invokes application-defined API method
    RpcService->>UserApp: (execute registered API method)
    UserApp-->>RpcService: resultData
    RpcService->>RequestBuilder: createRpcResponseRequest(resultData, requestId)
    activate RequestBuilder
    RequestBuilder->>EncodingService: encode(responseRequest)
    activate EncodingService
    EncodingService-->>RequestBuilder: encodedResponse
    deactivate EncodingService
    RequestBuilder-->>RpcService: builtResponse
    deactivate RequestBuilder
    RpcService->>WebTorrentService: send(peerId, builtResponse)
    activate WebTorrentService
    WebTorrentService-->>RpcService: success/failure
    deactivate WebTorrentService
    RpcService-->>Controller: API call processed
    deactivate RpcService
    Controller-->>Router: RPC response initiated
    deactivate Controller
    deactivate Router

    %% 6. Inbound RPC Response Handling (Original caller receives RPC response)
    WireExtension->>Router: handleMessage(encodedRpcResponse, peerId)
    activate Router
    Router->>EncodingService: decode(encodedRpcResponse)
    activate EncodingService
    EncodingService-->>Router: decodedRpcResponse
    deactivate EncodingService
    Router->>RequestParser: parse(decodedRpcResponse)
    activate RequestParser
    RequestParser-->>Router: rpcResponseObject
    deactivate RequestParser
    Router->>Controller: process(rpcResponseObject, peerId)
    Note over Router,Controller: Specifically RPCResponseController
    activate Controller
    Controller->>RpcService: callResponse(requestId, data, error)
    activate RpcService
    Note over RpcService,UserApp: RpcService invokes original callback
    RpcService->>UserApp: (trigger original callback with data/error)
    UserApp-->>RpcService: (RPC data processed by app)
    RpcService-->>Controller: Callback executed
    deactivate RpcService
    Controller-->>Router: RPC response processed
    deactivate Controller
    deactivate Router
```

## Features and Utility

B2BNet is a TypeScript library designed to simplify the development of peer-to-peer (P2P) applications that run directly in web browsers. It provides a higher-level abstraction over the complexities of underlying P2P technologies like WebRTC and WebTorrent, making it easier for developers to build decentralized browser-based applications.

Key utilities of the B2BNet library include:

*   **Simplification of P2P Development:** B2BNet offers a more accessible API compared to working directly with the low-level details of WebRTC and WebTorrent. This allows developers to focus on application logic rather than the intricacies of P2P connectivity, signaling, and data exchange.

*   **Peer Management:** The library handles crucial aspects of peer lifecycle management. This includes discovering other peers in the network, establishing connections, tracking the status of connected peers, and managing connection timeouts or disconnections. This is likely managed through services like `src/services/peer.ts`.

*   **Message Encoding and Encryption:** B2BNet manages the serialization and deserialization of messages exchanged between peers, ensuring data is correctly formatted for transmission. Furthermore, it likely incorporates encryption capabilities, potentially using libraries like `tweetnacl` (suggested by the presence of `src/services/encryption.ts`), to secure communications between peers.

*   **Remote Procedure Calls (RPC):** The library provides an RPC mechanism (likely found in `src/services/rpc.ts` and `src/controllers/rpccall.ts`), enabling peers to define functions that can be remotely invoked by other peers. This simplifies the implementation of complex interactions and distributed logic within the P2P network.

*   **Leveraging WebTorrent:** B2BNet likely utilizes WebTorrent for efficient data transfer and robust connectivity. WebTorrent's ability to use BitTorrent protocols over WebRTC data channels can enhance data exchange speeds and help in NAT traversal, improving overall P2P connection reliability. The presence of `src/services/torrent.ts` supports this.

*   **Event-Driven Architecture:** The library employs an event-driven model (suggested by `src/services/events.ts`), allowing applications to react to various network events. This can include events like new peer connections, disconnections, incoming messages, or RPC calls, enabling developers to build responsive and dynamic P2P applications.

*   **Facilitating Decentralization:** By simplifying browser-to-browser communication and reducing the need for central servers for many operations, B2BNet empowers developers to build more decentralized applications. This can lead to increased user privacy, reduced operational costs, and greater resilience against single points of failure.

## Potential Use Cases

B2BNet, as a library facilitating direct browser-to-browser (P2P) networking, opens up possibilities for a variety of decentralized applications and features. By removing or reducing reliance on central servers, these applications can offer enhanced privacy, lower operational costs, and increased resilience.

Here are some potential use cases for the B2BNet library:

*   **Decentralized Chat Applications:**
    *   Users can chat directly with each other without messages passing through a central server, enhancing privacy.
    *   Group chats can be formed by connecting multiple peers directly.

*   **Collaborative Editing Tools:**
    *   Real-time collaborative document editing (like Google Docs, but P2P) where changes are synced directly between users' browsers.
    *   Shared whiteboards or design tools where multiple users can draw or contribute simultaneously.

*   **P2P File Sharing Systems:**
    *   Users can share files directly from their browser to another user's browser without needing to upload them to a server first.
    *   This can be useful for sharing large files or for creating private file-sharing networks.

*   **Multiplayer Browser Games with P2P Communication:**
    *   Reduce latency in real-time multiplayer games by sending game state updates directly between players.
    *   Host game sessions without relying on dedicated game servers, especially for smaller, private game rooms.

*   **Video/Audio Streaming Directly Between Users:**
    *   One-to-one or small group video and audio calls directly between browsers, similar to WebRTC-based calling apps but potentially with custom signaling and features built on B2BNet.
    *   Live streaming of user-generated content directly to a limited number of viewers in a P2P fashion.

*   **Decentralized Social Media Feeds:**
    *   Users could share updates or content directly with their followers in a P2P manner, reducing reliance on a central platform.

*   **P2P Data Synchronization:**
    *   Synchronizing application data (e.g., settings, local databases) across a user's multiple devices/browsers directly.

*   **IoT Device Communication via Browser Gateways:**
    *   Browsers acting as gateways to communicate with local IoT devices, and then relaying that information to other browsers or devices in a P2P network.

*   **Content Delivery Networks (CDNs) - Browser-assisted delivery:**
    *   Users who have already downloaded a piece of content can help serve it to other nearby users, reducing load on origin servers (similar to Peertube's model).

These use cases leverage B2BNet's core strength: enabling direct, secure, and efficient communication channels between web browsers, paving the way for more innovative and user-centric web applications.

## Installation

(Details on how to install and integrate B2BNet into a project will be added here.)

## Getting Started

(A simple example of how to use the library will be added here.)

## API Reference

(Link to API documentation or key API points will be added here.)

## Contributing

(Guidelines for contributing to the project will be added here.)

## License

This project is licensed under the terms of the LICENSE file.
This project is licensed under the terms of the LICENSE file.
