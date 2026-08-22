# BioMed Fingerprint System - Backend

## 🚀 Features

- **Biometric Authentication**: Fingerprint-based login and verification
- **Multi-Finger Enrollment**: Support for all 10 fingers
- **1:1 Verification**: Verify against a single fingerprint template
- **1:N Identification**: Search across multiple templates
- **Secure Storage**: AES-256 encryption for fingerprint templates
- **JWT Authentication**: Token-based authentication
- **Audit Logging**: Complete trail of all actions
- **Role-Based Access**: Admin and user roles
- **Rate Limiting**: Protection against brute force attacks
- **File Upload**: Profile image upload support

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## 🛠️ Installation

```bash
# Clone repository
git clone https://github.com/yourusername/biomed-backend.git

# Navigate to project
cd biomed-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configurations