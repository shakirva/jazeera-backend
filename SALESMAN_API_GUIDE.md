# Jazeera Salesman Mobile Application - API Integration Guide

This guide describes the REST API endpoints provided by the backend to support the salesman mobile application. All requests and responses communicate via JSON payloads.

---

## 🔒 Authentication & Headers

Except for the Login route, all routes require a JSON Web Token (JWT) sent in the HTTP headers:
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## 🔑 1. Authentication Endpoints

### **Salesman / User Login**
Authenticates the user and returns the JWT access token and user profile details.
* **Endpoint**: `/api/v1/auth/login`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "email": "salesman@jazeera.com",
    "password": "password123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi...",
      "user": {
        "id": "2d1f9254-6e01-4440-97b8-69a2e0ebe34d",
        "name": "Tarek Mansoor",
        "email": "salesman@jazeera.com",
        "phone": "+971503334444",
        "role": "SALESMAN"
      }
    }
  }
  ```

---

## 📄 2. B2B Quotations Management

### **Create a Quotation (Draft)**
Creates a new draft quotation for a customer. 
* **Endpoint**: `/api/v1/salesman/quotations`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "customerId": "5ea8986a-30a8-43db-a3b9-dbc47acff0d1", 
    "remarks": "Negotiating bulk water order discount",
    "items": [
      {
        "productId": "24589969-85e9-426a-8777-887e7ffd17a2",
        "quantity": 50,
        "unitPrice": 1.50,
        "requestedPrice": 1.20,
        "discountPct": 0,
        "suggestedMode": true
      }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "1b80e503-2639-401f-aa25-174162ffda54",
      "salesmanId": "2d1f9254-6e01-4440-97b8-69a2e0ebe34d",
      "customerId": "5ea8986a-30a8-43db-a3b9-dbc47acff0d1",
      "status": "DRAFT",
      "totalAmount": 60.00,
      "remarks": "Negotiating bulk water order discount",
      "pdfUrl": null,
      "createdAt": "2026-06-13T13:30:00.000Z",
      "items": [
        {
          "id": "item-uuid",
          "productId": "24589969-85e9-426a-8777-887e7ffd17a2",
          "quantity": 50,
          "unitPrice": 1.50,
          "requestedPrice": 1.20,
          "discountPct": 0,
          "suggestedMode": true,
          "product": {
            "id": "24589969-85e9-426a-8777-887e7ffd17a2",
            "name": "Mineral Water 500ml",
            "sku": "WAT-500",
            "unit": "pcs"
          }
        }
      ]
    }
  }
  ```

---

### **List My Quotations**
Retrieves quotations made by the logged-in salesman.
* **Endpoint**: `/api/v1/salesman/quotations`
* **Method**: `GET`
* **Query Parameters (Optional)**:
  * `status`: Filter by `DRAFT`, `SUBMITTED`, `APPROVED`, or `REJECTED`.
  * `customerId`: Filter by customer UUID.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "1b80e503-2639-401f-aa25-174162ffda54",
        "status": "DRAFT",
        "totalAmount": 60.00,
        "createdAt": "2026-06-13T13:30:00.000Z",
        "customer": {
          "id": "5ea8986a-30a8-43db-a3b9-dbc47acff0d1",
          "name": "Al Madina Supermarket"
        }
      }
    ]
  }
  ```

---

### **Get Quotation Details**
Retrieves itemized details for a specific quotation.
* **Endpoint**: `/api/v1/salesman/quotations/:id`
* **Method**: `GET`
* **Success Response (200 OK)**: Returns the detailed quotation JSON containing all fields (including manager rejection reasons if the quotation status is `REJECTED`, or `pdfUrl` if status is `APPROVED`).

---

### **Edit/Update Quotation**
Allows editing of items, quantities, and pricing overrides.
* **Endpoint**: `/api/v1/salesman/quotations/:id`
* **Method**: `PUT`
* **Note**: Can only be updated if current status is `"DRAFT"` or `"REJECTED"`.
* **Request Body**: Same schema as *Create a Quotation*.

---

### **Submit Quotation for Manager Review**
Submits the draft quotation to the office manager/admin. Transitions status to `"SUBMITTED"`.
* **Endpoint**: `/api/v1/salesman/quotations/:id/submit`
* **Method**: `POST`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Quotation submitted successfully for manager approval",
    "data": {
      "id": "1b80e503-2639-401f-aa25-174162ffda54",
      "status": "SUBMITTED"
    }
  }
  ```

---

## 📍 3. Customer Visits Tracking

### **Log Customer Visit**
Logs salesman check-ins at client shops with notes and location logs.
* **Endpoint**: `/api/v1/salesman/visits`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "customerId": "5ea8986a-30a8-43db-a3b9-dbc47acff0d1",
    "notes": "Met with shop manager, introduced upcoming juices inventory line.",
    "latitude": 25.0754,
    "longitude": 55.1887
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "76af3e1f-f99f-4440-97b8-69a2e0ebe34d",
      "salesmanId": "2d1f9254-6e01-4440-97b8-69a2e0ebe34d",
      "customerId": "5ea8986a-30a8-43db-a3b9-dbc47acff0d1",
      "notes": "Met with shop manager, introduced upcoming juices inventory line.",
      "lat": 25.0754,
      "lng": 55.1887,
      "visitedAt": "2026-06-13T13:40:00.000Z"
    }
  }
  ```

---

### **List Logged Visits**
Retrieves the history of all visits logged by the salesman.
* **Endpoint**: `/api/v1/salesman/visits`
* **Method**: `GET`
* **Success Response (200 OK)**: Returns array of visits containing notes and coordinates.
