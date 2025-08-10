$(document).ready(function() {
    // Mock user data - in a real application, this would come from a server
    const userData = {
        name: "João da Silva",
        email: "joao.silva@example.com",
        role: "Desenvolvedor Front-end",
        department: "Engenharia de Software",
        location: "São Paulo, Brasil",
        profilePic: "https://via.placeholder.com/150"
    };

    // Populate profile page with user data
    $('#user-name').text(userData.name);
    $('#user-email').text(userData.email);
    $('#user-role').text(userData.role);
    $('#user-department').text(userData.department);
    $('#user-location').text(userData.location);
    $('.profile-pic').attr('src', userData.profilePic);

    // Handle edit profile button click
    $('#edit-profile-btn').on('click', function() {
        alert("Funcionalidade de edição de perfil a ser implementada.");
        // Here you would typically open a modal or redirect to an edit page
    });
});
