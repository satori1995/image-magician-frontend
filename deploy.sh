# /bin/bash
docker rm -f image-magician-frontend
docker rmi -f image-magician-frontend
docker run --name image-magician-frontend -p 10001:80 -d image-magician-frontend