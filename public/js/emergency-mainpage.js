 function handleHelpRequest() {
           // alert('Help Request Assistance - Sign up functionality would be implemented here');
        }

        function handleEmergencyContact() {
            //alert('Emergency Contact management - Create/View contacts functionality would be implemented here');
        }

        function handleEmergencyCall() {
           // alert('Emergency Service Hotlines - Search functionality would be implemented here');
        }

        // Add smooth hover effects
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.service-card');
            
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-3px)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            });
        });