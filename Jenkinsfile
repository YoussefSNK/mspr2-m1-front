pipeline {
    agent any

    tools {
        // Nom défini dans Manage Jenkins → Tools → NodeJS installations.
        nodejs 'node20'
    }

    environment {
        IMAGE_NAME = 'futurekawa/frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // ?. et ?: sont autorisés ici car on est dans une chaîne Groovy
                // (double quote), pas dans un sh '...'.
                echo "Front récupéré : ${env.GIT_BRANCH} @ ${env.GIT_COMMIT?.take(8)}"
            }
        }

        stage('Install') {
            steps {
                // npm ci : reproductible, respecte package-lock.json (standard CI).
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                // Vite → génère dist/.
                sh 'npm run build'
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'dist/**', fingerprint: true
                echo 'Bundle front prêt dans dist/'
            }
        }

        stage('Docker Image') {
            // Ne construit l'image que si Docker est disponible sur l'agent.
            when {
                expression { sh(script: 'command -v docker', returnStatus: true) == 0 }
            }
            steps {
                script {
                    def tag = "${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${tag} -t ${IMAGE_NAME}:latest ."
                    echo "Image Docker construite : ${tag} (+ latest)"
                }
            }
        }
    }

    post {
        failure { echo "Pipeline front échouée sur ${env.GIT_BRANCH}" }
        success { echo 'Pipeline front réussie — bundle prêt pour la démo' }
    }
}
