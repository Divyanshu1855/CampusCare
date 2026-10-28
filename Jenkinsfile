pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm test'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build and Deploy Containers') {
            steps {
                sh 'docker compose config'
                sh 'docker compose up -d --build'
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                  for i in $(seq 1 20); do
                    if curl --fail --silent http://127.0.0.1/api/health; then
                      echo "CampusCare health check passed"
                      exit 0
                    fi
                    sleep 3
                  done
                  echo "Health check failed"
                  docker compose ps
                  docker compose logs --tail=100
                  exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'CampusCare build and deployment completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Review the stage logs before retrying.'
        }
    }
}
