This are reminders for the development of the system.

1. The system must be responsive and mobile-friendly.

2. The system must be secure and it should always use the latest security protocols and the .env file for the environment variables and no hard-coded values.

3. Every part of the system must be customizable/editable.

4. The system has 5-tier roles (Superadmin, Admin, Officer, Barangay Captain, Constituents/Stakeholders)
   - Superadmin: Has full access to the system and can manage all users, roles, and permissions.
   - Admin: Can manage users(officers, barangay captains, constituents/stakeholders), roles, and permissions.
   - Officer: This is like an admin but for a specific office. Can only manage their respective office. They cannot manage any user roles.
   - Barangay Captain: Can manage their respective barangay only.
   - Constituents/Stakeholders: Has access to the system and can view and interact with the system. This is the end-user or the target user for the system.

   Note: Manage means to add, edit, delete, and view.

5. All data must be stored in the database because all data must be editable and customizable by a certain role. No hard-coded values or data.

6. Make sure that UI for every role has only minimal difference. It should be almost similar to each other for easy navigation and understanding of the different roles and when they would like to edit or manage something. For users who can manage content, do not differ their UI from the Constituents/Stakeholders UI, just put the manage button in the top right corner. The manage button on the top right corner should only contain edit and delete options. There is no need for view because by default, the Constituents/Stakeholders can view the content so as the Admin and Officer. The add button for the one who can manage content should be on top of the content if the content display is a list type, meaning, if the content is a list type, the add button should be on top of the list. Just make sure the UI of the one who will manage content will not differ from the Constituents/Stakeholders UI, just add the manage buttons without removing any UI that is in the Constituents/Stakeholders UI.
Meaning, the Constituents/Stakeholders UI should be the base UI for all roles and the other roles should only add the manage buttons.

7. Make sure the UI and UX accross the system is consistent and easy to navigate. 


Note: The system to be developed doesn't gave online service delivery. It only contain information dissemination about the services and all the things they need to know before applying for that service. 