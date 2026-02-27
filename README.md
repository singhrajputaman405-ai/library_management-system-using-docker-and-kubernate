# 📚 Library Management System

A full‑stack web application for managing library operations – books, members, borrowing, and automated fine calculation. Containerized with Docker and orchestrated with Kubernetes for scalability and resilience.



---

## ✨ Features

- **Books Management** – Add, edit, delete books. Track total copies and available copies in real time.
- **Members Management** – Register library members (students) with unique ID, email, phone.
- **Borrow / Return** – Issue books with a due date; on return, the system automatically calculates fines (₹0.50 per day overdue).
- **Fine Payment** – Mark fines as paid; the status is recorded.
- **Persistent Storage** – MongoDB data survives container restarts thanks to Docker volumes and Kubernetes PersistentVolumeClaims.
- **Responsive UI** – Clean, modern interface with tabs and modals, built with vanilla HTML, CSS, and JavaScript.
- **Containerized** – Docker ensures a consistent environment across development and production.
- **Orchestrated** – Kubernetes provides self‑healing, scaling, and load balancing.

---

## 🛠️ Tech Stack

| Frontend         | Backend        | Database       | Container | Orchestration |
|------------------|----------------|----------------|-----------|---------------|
| HTML5, CSS3, JavaScript (ES6) | Node.js + Express | MongoDB + Mongoose | Docker | Kubernetes (Docker Desktop) |

---

## 🏗️ Architecture

```
User Browser → Backend Service (Node.js) → MongoDB
               ↑                            ↑
          (Docker container)           (Docker container)
               └────────── Kubernetes manages both ────────┘
```

- **Backend** serves static frontend files and exposes REST APIs.
- **MongoDB** stores books, members, and borrow records.
- Both run in Docker containers, managed by Kubernetes.
- A PersistentVolumeClaim ensures MongoDB data persists across pod restarts.
- The backend is replicated (2 pods) for high availability.

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with **Kubernetes enabled** (or any Kubernetes cluster)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

---

### 🐳 Running with Docker Compose (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/library-management-system.git
   cd library-management-system
   ```

2. **Start the application**
   ```bash
   docker-compose up
   ```

3. **Access the app**  
   Open `http://localhost:3000` in your browser.

4. **Stop**  
   Press `Ctrl+C` and run `docker-compose down`.

---

### ☸️ Deploying to Kubernetes

#### Using Docker Desktop’s built‑in Kubernetes

1. **Enable Kubernetes** in Docker Desktop (Settings → Kubernetes → Enable).

2. **Build the Docker image** (so it’s available locally)
   ```bash
   cd backend
   docker build -t library-backend:latest .
   cd ..
   ```

3. **Apply the Kubernetes manifests**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/
   ```

4. **Verify everything is running**
   ```bash
   kubectl get all -n library
   ```

5. **Access the application**  
   The backend service is exposed on NodePort `30080`. Open `http://localhost:30080`.

   Alternatively, use port‑forwarding:
   ```bash
   kubectl port-forward -n library svc/backend 8080:80
   ```
   Then visit `http://localhost:8080`.

6. **Scale the backend** (optional)
   ```bash
   kubectl scale deployment backend -n library --replicas=3
   ```

7. **Clean up**
   ```bash
   kubectl delete namespace library
   ```

---

## 📁 Project Structure

```
library-management-system/
├── backend/
│   ├── models/
│   │   ├── Book.js
│   │   ├── Member.js
│   │   └── Borrow.js
│   ├── public/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── k8s/
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── mongodb-deployment.yaml
│   ├── mongodb-service.yaml
│   └── mongodb-pvc.yaml
├── docker-compose.yml
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| GET    | `/api/books`                 | List all books                       |
| POST   | `/api/books`                 | Add a new book                       |
| PUT    | `/api/books/:id`             | Update a book                        |
| DELETE | `/api/books/:id`             | Delete a book                        |
| GET    | `/api/members`               | List all members                     |
| POST   | `/api/members`               | Add a new member                     |
| PUT    | `/api/members/:id`           | Update a member                      |
| DELETE | `/api/members/:id`           | Delete a member                      |
| GET    | `/api/borrows`               | List all borrow records              |
| POST   | `/api/books/:id/borrow`      | Borrow a book (requires memberId, dueDate) |
| POST   | `/api/borrows/:id/return`    | Return a book (calculates fine)      |
| POST   | `/api/borrows/:id/pay-fine`  | Mark a fine as paid                  |

---



---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---



---

If you find this project useful, please ⭐ star it on GitHub!
