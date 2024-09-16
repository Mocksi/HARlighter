# Mocksi Product Flow

Below is a sequence diagram that illustrates the interaction flow between a user, the Mocksi Chrome Extension, the Mocksi Server, and the AI Engine. 

This diagram provides a step-by-step visualization of the process from installing the extension to creating, editing, and playing a demo. 

```mermaid
sequenceDiagram
    participant U as User
    participant CLI as Chrome Extension
    participant S as Mocksi Server
    participant AI as AI Engine

    U->>CLI: Install Mocksi Chrome Extension
    CLI->>U: Prompt for email
    U->>CLI: Enter email
    CLI->>U: Send confirmation email
    U->>CLI: Enter confirmation code
    CLI->>S: Authenticate user
    S->>U: Authentication successful

    U->>CLI: Log into demo org
    CLI->>S: Access baseline demo organization

    U->>CLI: Start recording
    CLI->>U: Show recording screen
    U->>CLI: Interact with application
    CLI->>S: Capture user interactions

    CLI->>S: Process recorded data
    S->>CLI: Reflect waiting state
    S->>CLI: Notify processing complete

    U->>CLI: Create Demo
    U->>CLI: Edit Demo
    loop Edit Demo
        U->>CLI: Edit text manually
        CLI->>S: Automatically find and replace text
        CLI->>S: Changes auto-saved
        U->>CLI: Update images manually
        CLI->>S: Changes auto-saved
    end
    U->>CLI: Hit "Done"
    CLI->>U: Exit demo edit mode

    U->>CLI: Play Demo
    CLI->>S: Load and play demo
    CLI->>U: Show replay environment

    Note over U: Continue developing and testing with Mocksi
```