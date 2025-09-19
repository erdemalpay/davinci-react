# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start dev`

Runs the app in the development mode.\
Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

---

## Project Overview

This is a modern React application for managing orders, collections, and related business operations. The project is structured for scalability and maintainability, using best practices and popular libraries.

## Tech Stack

- **React** (TypeScript): Main UI framework.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **React Query (@tanstack/react-query)**: Data fetching, caching, and state management for server data.
- **React Toastify**: User notifications.
- **Vercel**: Deployment platform.

## Project Structure

- `src/components/`: Reusable UI components, organized by feature.
- `src/context/`: React Contexts for global state (e.g., orders, user, location).
- `src/hooks/`: Custom React hooks for logic reuse.
- `src/pages/`: Page-level components for routing.
- `src/utils/`: Utility functions and API logic.
- `src/locales/`: Localization files for multi-language support.
- `public/`: Static assets (images, sounds, manifest).

## Data Flow

- **API Layer**: Located in `src/utils/api/`, uses custom hooks and React Query for CRUD operations.
- **State Management**: Context API for global state, React Query for server state.
- **Optimistic Updates**: Mutations update UI before server confirmation, with rollback on error.
- **Notifications**: Errors and important actions are shown via Toastify.

## Development Flow

1. **Install dependencies**:
   ```bash
   yarn
   ```
2. **Start development server**:
   ```bash
   yarn start dev
   ```
3. **Code style**:

   - Use TypeScript for type safety.
   - Use Tailwind for styling.
   - Organize code by feature.

## Generic Components

- **GenericTable**: A reusable table component for displaying tabular data with sorting, filtering, and pagination features. Used across multiple modules for consistent data presentation.
- **GenericAddEdit,GenericAddComponent**: A flexible form component for adding and editing entities. Supports dynamic form fields and validation, reducing code duplication for CRUD operations.
- **FilterPanel**: A generic filtering UI used to refine data views in tables and lists. Easily extendable for different data types and business logic.

These components are designed for maximum reusability and maintainability, allowing rapid development and a consistent user experience throughout the application.

## Real-Time & WebSocket

- **Socket.IO** is used for real-time communication.
- The custom hook `useWebSocket` manages socket connections and event listeners.
- Event types and cache invalidation logic are centralized in `src/hooks/socketConstant.ts`.
- WebSocket events trigger React Query cache invalidation for instant UI updates.
- Audio notifications are played for specific order events.

## Contribution Guidelines

- Follow existing folder and naming conventions.
- Write clear, maintainable code.
- Document new components/hooks/context as needed.

---
