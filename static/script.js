/**
 * Main Client-Side Script
 * 
 * This file runs on every page of the Dracarys website.
 * It adds small, nice animations and interactive touches
 * so the site feels smooth and modern.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dracarys website loaded');

    // Find all team member cards on the page (used on the About page)
    const teamMembers = document.querySelectorAll('.team-member');

    // Create an observer that watches when elements scroll into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            // When a team member becomes visible...
            if (entry.isIntersecting) {
                // Stagger the animation so they fade in one after another
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);

                // Stop watching this element after it animates
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1   // Trigger when 10% of the element is visible
    });

    // Prepare each team member for animation
    teamMembers.forEach(member => {
        // Start them hidden and slightly lower
        member.style.opacity = '0';
        member.style.transform = 'translateY(20px)';
        
        // Add smooth transition (fade + slide up)
        member.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        // Start watching this element
        observer.observe(member);
    });
});