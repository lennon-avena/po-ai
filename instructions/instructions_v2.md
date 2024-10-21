# Technical Document: Task List for Implementing the Page Object Model (POM) Mapping System

## 1. Development Environment Setup
1. **System Configuration**
   - Install Node.js on the system, ensuring the version is compatible with the required libraries.
   - Install a code editor that supports React development, such as Visual Studio Code.

2. **Start a New Project**
   - Create a new Next.js project using TypeScript.
   - Add initial configurations and create the standard folder structure for a Next.js project.

3. **Dependency Installation**
   - Install the main project dependencies using npm, including React, Next.js, and the additional specific libraries as listed in the technologies.

4. **Tailwind CSS Configuration**
   - Configure Tailwind CSS for styling by creating the necessary configuration files.
   - Add Tailwind CSS classes to the global CSS files and ensure purging is enabled for production.

5. **Prisma and Database Setup**
   - Initialize Prisma and establish a connection to the MySQL database.
   - Define the database schema in the `schema.prisma` file, including the tables and relationships needed for POM functionality and elements.

## 2. Development of POM Functionalities

1. **User Interface Creation**
   - Develop screens for uploading screenshots and HTML using components from the Shadcn library and style them with Tailwind CSS.
   - Create a component that displays the screenshot and HTML interactively.

2. **File Upload Implementation**
   - Integrate file upload functionality using `uploadthing` and `@uploadthing/react`, allowing users to submit screenshot and HTML files.

3. **Screenshot and HTML preview**
   - Implement tools that allow users to preview the screenshot and HTML before saving them in the POM.

4. **POM Creation Form**
   - Create a form for entering POM data, allowing users to provide the name of the POM and the fields for the elements (type, name, locators, values, coordinates, actions, and required field).

5. **Data Validation with Zod**
   - Implement data validation for the form using the Zod library to ensure user inputs are valid.

6. **Coordinate Interaction and Visualization**
   - Implement functionality that allows the user to set element coordinates on the screenshot and visualize rounded boxes around corresponding elements.

7. **Element Verification Functionality**
   - Add a "Check" button that executes a JavaScript script using `document.querySelector` to verify if the element exists in the uploaded HTML when clicked.

8. **CRUD for POM Elements**
   - Create functionalities for adding, editing, and deleting elements within the POM in the database. This includes:
     - Saving elements to the database.
     - Editing existing elements.
     - Deleting elements from the database as per user action.

9. **Implementation of LLM API Communication**
   - Develop functionality that calls a custom LLM API when clicking the "Magic" button, sending the screenshot and HTML.
   - Process the JSON response from the API and automatically populate the elements list.

## 3. POM Management and Navigation

1. **POM List Interface**
   - Create an interface for users to view all POM entries stored in the database.
   - Allow users to click on a POM in the list to view details, edit, or delete it.

2. **POM Details Implementation**
   - Develop a detailed page that displays all information related to a selected POM, including all associated elements.

3. **Edit and Delete POM Functionalities**
   - Integrate functionalities that allow users to edit or delete POMs using CRUD operations on the database.

## 4. Testing and Validation
1. **Unit Testing**
   - Implement unit tests for all main functionalities using a testing library like Jest.

2. **Integration Testing**
   - Create integration tests to ensure that the interaction between frontend and backend works as expected, especially for CRUD operations.

3. **Usability Testing**
   - Conduct testing sessions with real users to ensure that the interface and user experience are intuitive and functional.

4. **Security Validation**
   - Test the application for common vulnerabilities, such as SQL injection and XSS, and implement necessary fixes.

## 5. Conclusion and Documentation
1. **Code Documentation**
   - Document the code and functionalities of the application to facilitate future maintenance and understanding by other developers.

2. **Deployment Preparation**
   - Set up the necessary scripts for deploying the application on a server, optimizing the build for production.

3. **Monitoring and Feedback**
   - Implement analytics and monitoring tools to collect feedback and usage data after the application is released.

This task list aims to provide a comprehensive overview of what needs to be done to effectively and systematically implement the proposed application.

## 6. Current file structure
po-ai
├── app
|  ├── favicon.ico
|  ├── fonts
|  ├── globals.css
|  ├── layout.tsx
|  └── page.tsx
├── components
|  └── ui
├── components.json
├── hooks
|  ├── use-mobile.tsx
|  └── use-toast.ts
├── instructions
|  └── instructions.md
├── lib
|  └── utils.ts
├── next-env.d.ts
├── next.config.mjs
├── out.txt
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── prisma
|  └── schema.prisma
├── README.md
├── tailwind.config.ts
└── tsconfig.json