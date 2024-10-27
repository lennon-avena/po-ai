# Project overview
You are building a React Web App to mapping Page Object Model (POM) of a Web Application, identifying the elements and the actions that can be performed on the page.

You will be using this technologies:
1. "npm" to manage the packages;
2. "ReactJS" (typescript) to build the App;
3. "NextJS" with "App Router" to build the App;
4. "Shadcn" to build the UI;
5. "tailwindcss", "tailwind-merge", "tailwind-animate" and "postcss" to style the App; 
6. "@prisma/client" to build the database in "Mysql"; 
7. "@clerk/nextjs" and "@clerk/themes" to login with Google; 
8. "uploadthing" and "@uploadthing/react" to upload files; 
9. "@hookform/resolvers" to handle the forms;
10. "zod" to validate the data;
11. "lucide-react" to icons;
12. "uuid" to generate unique identifiers.

# Core functionalities
1. User can create a new Page Object Model (POM):
    1. User can upload a Screenshot and the HTML of a web page:
        1. App will display the Screenshot and the HTML of a web page;
        2. User can edit the Screenshot and the HTML of a web page;
        3. User can insert a Name for the POM;
        4. App will display a simple crud list to user create, edit and save the each elements with the fields of the POM:
            - Element type: (input, button, etc.);
            - Element name (e.g. "Username", "Password");
            - Element type of locator (e.g. "id", "name", "xpath", "css-selector");
            - Element value of locator (e.g. "username", "password");
            - Element coordinates on screenshot (x, y):
                - Element coordinate x;
                - Element coordinate y;
            - Element list of actions (e.g. "click", "input", "submit", select, etc.):
                - Action 1;
                - Action 2;
                - Action 3;
            - Element obligatory (true or false)
        4. Once the user set coordinates of the element, App will display the element on the screenshot with rounding boxes.
        5. After the user set each element, the app will enable the "Check" button to check if the element will be find in the HTML using simple javascript function.
        5. User can save the element to the database.
        5. User can edit the element to the database.
        6. User can delete the element from the database.   
    2. After the user set all fields of each element, the app will enable the "Check" button to check if the element will be find in the HTML: 
        1. Base on the information of the locators fields element, build the javascript "document.querySelector" to find element;
        2. Use this simple javascript function to check if the element will be founded.
    3. Once the user set POM, the user can click in the "Magic' button to call a custom LLM API, sending Screenshot and HTML files, to identify automatically the elements fields and the actions that can be performed on the page:
        1. With the custom LLM API json return, the App will populate a list of elements with the fields of the POM:
            - Element type: (input, button, etc.);
            - Element name (e.g. "Username", "Password");
            - Element type of locator (e.g. "id", "name", "xpath", "css-selector");
            - Element value of locator (e.g. "username", "password");
            - Element coordinates on screenshot (x, y):
                - Element coordinate x;
                - Element coordinate y;
            - Element list of actions (e.g. "click", "input", "submit", select, etc.):
                - Action 1;
                - Action 2;
                - Action 3;
            - Element obligatory (true or false).
2. App will show the list of POM in the database.
    1. User can click on the POM to see the details of the POM.
    2. User can edit the POM.
    3. User can delete the POM from the database.




# Current file structure
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
├── schema.prisma
├── README.md
├── tailwind.config.ts
└── tsconfig.json