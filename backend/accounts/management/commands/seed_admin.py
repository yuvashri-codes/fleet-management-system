import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds a default admin account into the database'

    def handle(self, *args, **options):
        email = os.getenv('SEED_ADMIN_EMAIL', 'yuvashrim28@gmail.com')
        password = os.getenv('SEED_ADMIN_PASSWORD', 'admin@123')
        
        self.stdout.write(f"Seeding admin account: {email}")
        
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.SUCCESS(f"Admin account '{email}' already exists. Skipping."))
            return
            
        try:
            admin_user = User.objects.create_superuser(
                email=email,
                password=password,
                first_name='System',
                last_name='Administrator',
                role=User.Role.ADMIN
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully seeded admin account '{email}' with role: {admin_user.role}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to seed admin account: {str(e)}"))
