#!/bin/bash

# FitQuest Quick Deployment Script
# Usage: ./quick-deploy.sh [backend|frontend|all]

set -e  # Stop immediately on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}FitQuest Quick Deployment Tool${NC}"
echo "=================================="

# Check parameters
DEPLOY_TARGET=${1:-"all"}

# Function: Pull latest code
pull_latest() {
    echo -e "${YELLOW}Pulling latest code...${NC}"
    git pull --rebase
    echo -e "${GREEN}Code updated${NC}"
}

# Function: Deploy backend
deploy_backend() {
    echo -e "${YELLOW}Deploying backend to Cloud Run...${NC}"
    cd backend
    
    # Check if deploy.sh exists
    if [ ! -f "./deploy.sh" ]; then
        echo -e "${RED}deploy.sh script not found${NC}"
        exit 1
    fi
    
    # Execute deployment
    ./deploy.sh
    
    # Test deployment result
    echo -e "${YELLOW}Testing deployment result...${NC}"
    sleep 5
    
    if curl -s https://comp90018-t8-g2.web.app/api/health | grep -q "ok"; then
        echo -e "${GREEN}Backend deployment successful!${NC}"
    else
        echo -e "${RED}Backend deployment may have failed, please check${NC}"
    fi
    
    cd ..
}

# Function: Restart frontend
restart_frontend() {
    echo -e "${YELLOW}Restarting frontend development server...${NC}"
    
    # Stop existing expo processes
    pkill -f "expo start" || true
    
    cd frontend
    
    # Check dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start development server
    echo -e "${GREEN}Frontend server starting...${NC}"
    echo -e "${BLUE}Please wait for QR code to appear, then scan with your phone${NC}"
    npm start
    
    cd ..
}

# Function: Deploy Firebase Hosting
deploy_hosting() {
    echo -e "${YELLOW}Deploying Firebase Hosting...${NC}"
    firebase deploy --only hosting
    echo -e "${GREEN}Hosting deployment complete${NC}"
}

# Main logic
case $DEPLOY_TARGET in
    "backend")
        pull_latest
        deploy_backend
        echo -e "${GREEN}Backend deployment complete!${NC}"
        ;;
    "frontend")
        pull_latest
        restart_frontend
        ;;
    "hosting")
        pull_latest
        deploy_hosting
        ;;
    "all")
        pull_latest
        deploy_backend
        echo -e "${BLUE}Backend deployment complete, now starting frontend...${NC}"
        restart_frontend
        ;;
    *)
        echo -e "${RED}Invalid parameter: $DEPLOY_TARGET${NC}"
        echo "Usage: $0 [backend|frontend|hosting|all]"
        echo ""
        echo "Options:"
        echo "  backend  - Deploy backend to Cloud Run only"
        echo "  frontend - Restart frontend development server only"
        echo "  hosting  - Deploy Firebase Hosting only"
        echo "  all      - Deploy backend and restart frontend (default)"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Useful links:"
echo "- API Health Check: https://comp90018-t8-g2.web.app/api/health"
echo "- API Documentation: https://comp90018-t8-g2.web.app/docs"
echo "- Firebase Console: https://console.firebase.google.com/project/comp90018-t8-g2"
echo "- Cloud Run Console: https://console.cloud.google.com/run"
echo ""
