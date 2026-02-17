export default {
    common: {
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        search: 'Search',
        reset: 'Reset',
        close: 'Close',
        submit: 'Submit',
        update: 'Update',
        create: 'Create',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        loading: 'Loading...',
        noData: 'No data',
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    },

    nav: {
        dashboard: 'Dashboard',
        customers: 'Customers',
        products: 'Products',
        orders: 'Orders',
        warehouse: 'Warehouse',
        warehouseList: 'Warehouse List',
        stockIn: 'Stock In',
        stockOut: 'Stock Out',
        hr: 'Human Resources',
        employees: 'Employees',
        attendance: 'Attendance',
        salaries: 'Salaries',
        reports: 'Reports',
        settings: 'Settings',
        more: 'More',
        home: 'Home'
    },

    header: {
        profile: 'Profile',
        logout: 'Logout',
        logoutConfirm: 'Are you sure you want to logout?',
        logoutSuccess: 'Logout successful'
    },

    customer: {
        title: 'Customer Management',
        list: 'Customer List',
        add: 'Add Customer',
        edit: 'Edit Customer',
        delete: 'Delete Customer',
        deleteConfirm: 'Are you sure you want to delete customer "{name}"?',
        deleteSuccess: 'Customer deleted successfully',
        createSuccess: 'Customer created successfully',
        updateSuccess: 'Customer updated successfully',
        loadError: 'Failed to load customer data',
        saveError: 'Failed to save data',
        description: 'List of all customers in the system',
        noCustomers: 'No customers',

        fields: {
            code: 'Customer Code',
            name: 'Customer Name',
            email: 'Email',
            phone: 'Phone Number',
            address: 'Address',
            taxCode: 'Tax Code',
            status: 'Status',
            note: 'Note',
            active: 'Active',
            inactive: 'Inactive'
        },

        placeholders: {
            code: 'Enter customer code',
            name: 'Enter customer name',
            email: 'Enter email',
            phone: 'Enter phone number',
            address: 'Enter address',
            taxCode: 'Enter tax code',
            note: 'Enter note',
            search: 'Name, email, phone number...'
        },

        validation: {
            codeRequired: 'Please enter customer code',
            nameRequired: 'Please enter customer name',
            emailRequired: 'Please enter email',
            emailInvalid: 'Invalid email',
            phoneRequired: 'Please enter phone number'
        }
    },

    pagination: {
        total: 'Total',
        items: 'items',
        itemsPerPage: 'Items per page'
    }
}
