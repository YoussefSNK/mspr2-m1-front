pipeline {
    agent any


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
                // Tests + couverture. On produit aussi un rapport JUnit
                // (test-results.xml) et un rapport Cobertura (coverage/…xml),
                // exploités par Jenkins ci-dessous — même approche que le back.
                sh 'npm run test:coverage -- --reporter=default --reporter=junit --outputFile=test-results.xml'
            }
            post {
                always {
                    junit 'test-results.xml'
                    cobertura coberturaReportFile: 'coverage/cobertura-coverage.xml'
                }
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
                archiveArtifacts artifacts: 'dist/**, coverage/cobertura-coverage.xml', fingerprint: true
                echo 'Bundle front + rapport de couverture archivés'
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
