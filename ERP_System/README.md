# Authentication Service (Auth Service)

A robust, enterprise-grade authentication and authorization service built with Spring Boot. This service handles user authentication, role-based access control (RBAC), session management, and multi-tenant company administration.

## 🚀 Features

- **User Authentication**: Secure login with email verification
- **Session Management**: Session control with configurable session limits
- **Role-Based Access Control (RBAC)**: Granular permission management
- **Multi-Tenant Support**: Company and module-based access control
- **Email Verification**: Email service integration for account verification
- **Dashboard Management**: User dashboard with company and module information
- **Exception Handling**: Comprehensive error handling with custom exceptions
- **CORS Support**: Cross-origin resource sharing configuration
- **API Documentation**: OpenAPI/Swagger documentation included

## 🛠️ Technology Stack

- **Framework**: Spring Boot
- **Language**: Java
- **Build Tool**: Maven
- **Database**: (Configured in application.yml)
- **API Documentation**: OpenAPI/Swagger
- **Email Service**: Integrated email service for notifications

## 📋 Prerequisites

- Java 8 or higher (recommended: Java 11+)
- Maven 3.6.0 or higher
- Git
- IDE (IntelliJ IDEA, Eclipse, or VS Code)

## 📦 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd auth_service
```

### 2. Build the project
```bash
./mvnw clean install
```

On Windows:
```bash
mvnw.cmd clean install
```

### 3. Run the application
```bash
./mvnw spring-boot:run
```

On Windows:
```bash
mvnw.cmd spring-boot:run
```

## ⚙️ Configuration

Configuration is managed through `src/main/resources/application.yml`. Key configuration sections include:

- **Server Settings**: Port, servlet context path
- **Database**: Connection URL, username, password
- **Email Service**: SMTP configuration for email notifications
- **Security**: JWT settings, session timeouts
- **CORS**: Allowed origins and methods

## 🏗️ Project Structure

```
auth_service/
├── src/main/java/com/erp/auth_service/
│   ├── AuthServiceApplication.java           # Main Spring Boot application
│   ├── config/                                # Configuration classes
│   │   ├── AppConfig.java                     # Application configuration
│   │   ├── CorsConfig.java                    # CORS configuration
│   │   ├── SecurityConfig.java                # Security configuration
│   │   └── SystemAdminBootstrap.java          # Initial system admin setup
│   ├── controller/                            # REST controllers
│   │   ├── AuthController.java                # Authentication endpoints
│   │   ├── UserController.java                # User management
│   │   ├── RoleController.java                # Role management
│   │   ├── CompanyController.java             # Company management
│   │   ├── ModuleController.java              # Module management
│   │   ├── CompanyModuleController.java       # Company-Module associations
│   │   ├── SessionController.java             # Session management
│   │   └── DashboardController.java           # Dashboard data
│   ├── service/                               # Business logic
│   ├── repository/                            # Data access layer
│   ├── model/                                 # Entity models
│   ├── dto/                                   # Data Transfer Objects
│   │   ├── request/                           # Request DTOs
│   │   └── response/                          # Response DTOs
│   ├── exception/                             # Custom exceptions
│   │   ├── GlobalExceptionHandler.java        # Centralized exception handling
│   │   ├── AuthenticationException.java       # Auth-related exceptions
│   │   ├── UnauthorizedException.java
│   │   ├── ForbiddenException.java
│   │   ├── ResourceNotFoundException.java
│   │   ├── DuplicateResourceException.java
│   │   ├── EmailNotVerifiedException.java
│   │   ├── AccountLockedException.java
│   │   ├── SessionLimitExceededException.java
│   │   ├── TokenExpiredException.java
│   │   ├── BadRequestException.java
│   │   └── InvalidOperationException.java
│   ├── mail/                                  # Email service
│   ├── mapper/                                # Entity/DTO mappers
│   ├── security/                              # Security filters and utilities
│   └── utility/                               # Helper utilities
├── src/main/resources/
│   ├── application.yml                        # Application configuration
│   ├── static/                                # Static resources
│   └── templates/                             # Email templates
├── src/test/                                  # Unit tests
├── pom.xml                                    # Maven configuration
├── mvnw                                       # Maven wrapper (Linux/Mac)
├── mvnw.cmd                                   # Maven wrapper (Windows)
├── api-docs.json                              # OpenAPI documentation
├── postman.json                               # Postman collection
└── sso-postman-collection.json                # SSO specific Postman collection
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-email` - Email verification

### Users
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Roles
- `GET /api/roles` - List all roles
- `GET /api/roles/{id}` - Get role by ID
- `POST /api/roles` - Create new role
- `PUT /api/roles/{id}` - Update role
- `DELETE /api/roles/{id}` - Delete role

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/{id}` - Get company by ID
- `POST /api/companies` - Create new company
- `PUT /api/companies/{id}` - Update company

### Modules
- `GET /api/modules` - List all modules
- `GET /api/modules/{id}` - Get module by ID

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Sessions
- `GET /api/sessions` - Get user sessions
- `DELETE /api/sessions/{id}` - End specific session

For complete API documentation, refer to `api-docs.json` or import `postman.json` into Postman.

## 🧪 Testing

Run the test suite:
```bash
./mvnw test
```

On Windows:
```bash
mvnw.cmd test
```

## 📝 Exception Handling

The service includes comprehensive exception handling with custom exceptions for various scenarios:

- **AuthenticationException** - Authentication failures
- **UnauthorizedException** - Access denied errors
- **ForbiddenException** - Insufficient permissions
- **ResourceNotFoundException** - Resource not found
- **DuplicateResourceException** - Resource already exists
- **EmailNotVerifiedException** - Email not verified
- **AccountLockedException** - Account is locked
- **SessionLimitExceededException** - Session limit reached
- **TokenExpiredException** - Token/session expired
- **BadRequestException** - Invalid request
- **InvalidOperationException** - Invalid operation

## 🔐 Security Features

- Session-based authentication
- Email verification for new accounts
- Account locking after failed login attempts
- Session limit per user
- CORS protection
- Centralized security configuration

## 📧 Email Service

The application includes an integrated email service for:
- Email verification on registration
- Password reset notifications
- Account notifications

Configure email settings in `application.yml`:
```yaml
mail:
  smtp:
    host: your-smtp-host
    port: your-smtp-port
    username: your-email
    password: your-password
```

## 🚀 Deployment

### Build for Production
```bash
./mvnw clean package -DskipTests
```

### Run the JAR
```bash
java -jar target/auth-service-*.jar
```

### Environment Variables
Configure the following environment variables for production:
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `MAIL_HOST` - SMTP host
- `MAIL_PORT` - SMTP port
- `MAIL_USERNAME` - Email username
- `MAIL_PASSWORD` - Email password

## 🔄 Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📚 API Documentation

- **OpenAPI/Swagger**: Available at `/swagger-ui.html` (if enabled)
- **Postman Collection**: Import `postman.json` for testing
- **SSO Collection**: Import `sso-postman-collection.json` for SSO testing

## 🐛 Troubleshooting

### Port already in use
Change the server port in `application.yml`:
```yaml
server:
  port: 8081
```

### Database connection issues
Verify database credentials in `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/auth_service
    username: root
    password: your-password
```

### Email service not working
Ensure SMTP settings are correctly configured and your email account allows SMTP connections.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For issues, questions, or contributions, please contact the development team or create an issue in the repository.

---

**Last Updated**: May 2026  
**Version**: 1.0.0
