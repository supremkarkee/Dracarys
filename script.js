document.addEventListener('DOMContentLoaded', () => {
    console.log('Dracarys website loaded');

    // Add simple entrance animation for team members
    const teamMembers = document.querySelectorAll('.team-member');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100); // Stagger effect
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    teamMembers.forEach(member => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(20px)';
        member.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(member);
    });
});
