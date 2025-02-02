from django.core.mail import send_mail

def send_email(subject, body, recipient):
    send_mail(
        subject,
        body,
        'from@example.com',  # Your email
        [recipient],
        fail_silently=False,
    )
