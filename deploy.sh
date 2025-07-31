# /bin/bash
git checkout .
git pull
docker rm -f image-magician-frontend
docker rmi -f image-magician-frontend
docker build -f Dockerfile -t image-magician-frontend . --no-cache
docker run --name image-magician-frontend -p 80:80 -d image-magician-frontend