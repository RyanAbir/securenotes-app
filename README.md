# 🔐 SecureNotes

**SecureNotes** is a modern, colorful, and highly organized note-taking application designed for individuals who value both security and aesthetics. Built with the MERN stack, it offers a seamless writing experience with rich text support, dynamic checklists, and image attachments, all wrapped in a premium SaaS-inspired dark theme.

![SecureNotes Banner](https://placehold.co/1200x600/09090b/fafafa?text=SecureNotes+Dashboard)

## ✨ Key Features

- **🎨 Vibrant Organization**: Categorize notes using an 8-color palette and custom tags.
- **📝 Multi-Format Support**:
    - **Rich Text**: Advanced editor with headings, lists, and code blocks (React Quill).
    - **Checklists**: Interactive todo lists with real-time progress tracking.
    - **Images**: Attach visual context to your thoughts (supports drag-and-drop).
- **📌 Smart Management**: Pin important notes and favorite your most-used items.
- **🔍 Advanced Search & Filter**: Instant search across titles, content, tags, and even checklist items. Filter by type (Text, Checklist, Image) or category.
- **🧱 Masonry Layout**: Dynamic, responsive grid that beautifully adapts to any screen size.
- **🔒 Secure Architecture**: Robust JWT-based authentication and secure password hashing.
- **🌙 Premium Dark UI**: Meticulously crafted dark mode with high-contrast typography and subtle micro-animations.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router, React Quill, DOMPurify, CSS3 (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JSON Web Tokens (JWT), BcryptJS
- **Styling**: Modern CSS Variables, Masonry (Column-count)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RyanAbir/securenotes-app.git
   cd securenotes-app
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create .env based on .env.example and add your MongoDB URI and JWT Secret
   npm start
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   # Update VITE_API_URL in your .env if different from default
   npm run dev
   ```

## 📋 Environment Variables

Refer to [.env.example](.env.example) for the required configuration.

## 🗺️ Roadmap
- [ ] Multi-select batch actions (delete/archive).
- [ ] Shareable public note links.
- [ ] Export notes to PDF/Markdown.
- [ ] Mobile app version (React Native).

## 👨‍💻 Author
**Ryan Abir**
- GitHub: [@RyanAbir](https://github.com/RyanAbir)

---
*Built for the Modern Web — Secure, Colorful, and Fast.*
