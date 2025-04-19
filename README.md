# JaMoveo Application Overview

## Project Description

JaMoveo is a collaborative musical rehearsal application that enables musicians to practice together virtually. The application serves as a digital platform for musical groups where participants with different instruments can view the same songs simultaneously, with each user seeing customized content based on their instrument (vocalists see only lyrics, while instrumentalists see both chords and lyrics).

## Core Features

- **Authentication System**: Complete user registration and login functionality with role-based access (admin/regular users) including Google Sign-In
- **Group Management**: Users can create groups (becoming admins) or join existing ones
- **Song Management**: Admins can search and select songs from a database to display to their group
- **Instrument-Specific Views**: Content display optimized for different instruments (vocalists see only lyrics)
- **Auto-scrolling Lyrics**: Configurable auto-scroll functionality with speed control
- **Responsive Design**: Full compatibility across desktop and mobile devices

## Technical Implementation

### Frontend (React)

- Built with React 19 and TypeScript for type safety
- Redux Toolkit for state management
- Socket.IO integration for real-time updates between users
- SCSS modules for component-scoped styling
- Responsive UI that adapts to different screen sizes

### Backend (Node.js)

- RESTful API built with Express.js
- TypeScript for enhanced code reliability
- Authentication using Passport.js with local and Google OAuth strategies
- Session management with cookie-session
- WebSocket communication via Socket.IO for real-time features

### Additional Features

- Web crawler functionality to fetch song data from external sources
- Real-time synchronized song display for all group members
- Protection against unauthorized access
- Hebrew language support with RTL text display

## Deployment

The application is deployed and available at https://jamoveo-8qpb.onrender.com/. The platform is hosted on Render.com with continuous deployment configured from the main branch.

## GitHub Repository

The source code is available at: https://github.com/natig4/JaMoveo
