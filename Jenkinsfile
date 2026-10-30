
pipeline {
    agent any

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

        stage('Backend Validation') {
            steps {
                dir('backend') {
                    bat 'npm install'
                    bat 'node --check server.js'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    bat 'npm install'
                    bat 'npm run build'
                }
            }
        }

        stage('Docker Build and Deploy') {
            steps {
                bat 'docker compose config'
                bat 'docker compose up -d --build'
            }
        }

        stage('Smoke Test') {
            steps {
                bat 'curl.exe --fail http://127.0.0.1/api/health'
            }
        }
    }

    post {
        success {
            echo 'CampusCare CI/CD pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the Console Output.'
        }
    }
}
