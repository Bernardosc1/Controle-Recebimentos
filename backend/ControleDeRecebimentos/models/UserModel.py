from django.contrib.auth.models import AbstractUser
from django.db import models
from .UserManager import UserManager


class User(AbstractUser):
    """
    Modelo de usuário customizado. O campo 'user_type' define o nível de acesso.
    """
    class UserType(models.TextChoices):
        DIRETOR = 'DIR', 'Diretor'
        GESTOR = 'GES', 'Gestor'

    email = models.EmailField(unique=True)
    user_type = models.CharField(
        max_length=3, choices=UserType.choices, default=UserType.GESTOR
    )

    # Remove o username do formulário de criação de superuser
    username = None

    # Define o email como o campo de login
    USERNAME_FIELD = 'email'
    # Campos obrigatórios ao criar um superuser (além de email e senha)
    REQUIRED_FIELDS = ['first_name', 'last_name']

    # Associa nosso manager customizado
    objects = UserManager()

    def save(self, *args, **kwargs):
        # Garante que o campo 'username' (que ainda existe no AbstractUser)
        # seja sempre uma cópia do email.
        self.username = self.email
        super().save(*args, **kwargs)
