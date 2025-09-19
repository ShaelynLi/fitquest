# Backend Setup

This document describes how to set up the **backend** of the project using **FastAPI** and integrate it with **Firebase Authentication** and **Firestore**.

---

## 1. Requirements

- A Firebase project with:
  - **Authentication** enabled (Email/Password sign-in method)  
  - **Firestore Database**  

---

## 2. Create a Virtual Environment

From the `backend` folder, create and activate a virtual environment:
```bash
cd backend
python -m venv venv
```
### Activate the environment:

macOS / Linux:
```bash
source venv/bin/activate
```

Windows:
```bash
venv\Scripts\activate
```

---

## 3. Install Dependencies

Install FastAPI, Uvicorn, Firebase Admin SDK, and supporting libraries:

```bash
pip install fastapi uvicorn[standard] firebase-admin httpx python-dotenv "pydantic[email]"
```

## 4. Firebase Setup

1. Go to the Firebase Console
2. Create a new project
3. In **Project Settings → Service Accounts**, generate a new **private key** and download the JSON file.
Place it in your backend folder:
```bash
backend/firebase_service_account.json
```
4. In **Project Settings → General**, copy the Web API Key

---

## 5. Environment Variables

Create a **.env file** and **service_account.json** in the config folder in backend folder and put your WebAPI key and service account key in it.

---

## 6. Run the Backend

Start the FastAPI server:
```bash
uvicorn main:app
```
The backend will run at http://127.0.0.1:8000

## 7. Backend Structure
```bash
backend/
├─ app/
│  ├─ main.py                  # only responsible for FastAPI、CORS、Middlewares、regist routers
│  ├─ api/                     # useful APIs
│  │  ├─ __init__.py
│  │  └─ auth.py               
│  ├─ core/                    
│  │  ├─ __init__.py
│  │  ├─ settings.py           # load .env and .json
│  │  └─ firebase.py           # initialization of firebase
│  ├─ dependencies/            # useful dependencies
│  │  ├─ __init__.py
│  │  └─ auth.py               
│  └─ schemas/                 # db models
│     ├─ __init__.py
│     └─ users.py               
├─ config/
│  ├─ .env                     # Web API Key
│  └─ firebase_service_account.json  # private service account
└─ requirements.txt
```

