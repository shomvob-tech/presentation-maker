pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    parameters {
        // Rollback for the HRIS document worker: re-run with false. POSTs still
        // return 202 and jobs wait in the database until it is back on.
        booleanParam(name: 'HRIS_WORKER_ENABLED', defaultValue: true, description: 'Run the HRIS document worker')
        string(name: 'HRIS_WORKER_CONCURRENCY', defaultValue: '2', description: 'Simultaneous HRIS renders (1 or 2)')
    }

    environment {
        REGISTRY     = 'ghcr.io/shomvob-tech/presentation-maker'
        GHCR_USER    = 'abrahimcse'                              
        GHCR_TOKEN   = credentials('GHCR_TOKEN')
        EC2_HOST     = credentials('OVERSEAS_PRIVATE_EC2_HOST')
        CONTAINER    = 'presentation-maker'
        PORT         = '3000'
        IMAGE_TAG    = "${REGISTRY}:${BUILD_NUMBER}"
        IMAGE_LATEST = "${REGISTRY}:latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push') {
            steps {
                sh '''
                    echo $GHCR_TOKEN | docker login ghcr.io \
                      -u $GHCR_USER --password-stdin

                    docker build \
                      -t $IMAGE_TAG \
                      -t $IMAGE_LATEST \
                      .

                    docker push $IMAGE_TAG
                    docker push $IMAGE_LATEST
                    docker rmi $IMAGE_TAG $IMAGE_LATEST
                '''
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['ec2-deploy-ssh-key']) {
                    withCredentials([
                        // ── Google Sheets audit log ───────────────────
                        string(credentialsId: 'STG_PM_GOOGLE_SERVICE_ACCOUNT_EMAIL', variable: 'GOOGLE_SERVICE_ACCOUNT_EMAIL'),
                        string(credentialsId: 'STG_PM_GOOGLE_PRIVATE_KEY_B64',       variable: 'GOOGLE_PRIVATE_KEY_B64'),
                        string(credentialsId: 'STG_PM_AUDIT_SHEET_ID',               variable: 'AUDIT_SHEET_ID'),
                        string(credentialsId: 'STG_PM_AUDIT_SHEET_TAB',              variable: 'AUDIT_SHEET_TAB'),
                        // ── /dashboard login ──────────────────────────
                        string(credentialsId: 'STG_PM_DASHBOARD_SESSION_SECRET',    variable: 'DASHBOARD_SESSION_SECRET'),
                        // ── HRIS proposal API ─────────────────────────
                        string(credentialsId: 'STG_PM_SUPABASE_URL',                 variable: 'SUPABASE_URL'),
                        string(credentialsId: 'STG_PM_SUPABASE_SERVICE_KEY',         variable: 'SUPABASE_SERVICE_KEY'),
                        string(credentialsId: 'STG_PM_HRIS_API_KEY',                 variable: 'HRIS_API_KEY'),
                        string(credentialsId: 'STG_PM_HRIS_ALLOWED_ORIGINS',         variable: 'HRIS_ALLOWED_ORIGINS'),
                        // ── HRIS async document API (client registry) ─
                        string(credentialsId: 'STG_PM_HRIS_CLIENTS_B64',             variable: 'HRIS_CLIENTS_B64')
                    ]) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_HOST \
                            "
                                echo '$GHCR_TOKEN' | docker login ghcr.io \
                                  -u $GHCR_USER --password-stdin

                                docker pull $IMAGE_LATEST

                                docker stop -t 30 $CONTAINER 2>/dev/null || true
                                docker rm   $CONTAINER 2>/dev/null || true

                                docker run -d --init \
                                  --name $CONTAINER \
                                  --restart unless-stopped \
                                  -p 127.0.0.1:$PORT:$PORT \
                                  -e NODE_ENV=production \
                                  -e PORT=$PORT \
                                  -e HOSTNAME=0.0.0.0 \
                                  -e GOOGLE_SERVICE_ACCOUNT_EMAIL='$GOOGLE_SERVICE_ACCOUNT_EMAIL' \
                                  -e GOOGLE_PRIVATE_KEY_B64='$GOOGLE_PRIVATE_KEY_B64' \
                                  -e AUDIT_SHEET_ID='$AUDIT_SHEET_ID' \
                                  -e AUDIT_SHEET_TAB='$AUDIT_SHEET_TAB' \
                                  -e DASHBOARD_SESSION_SECRET='$DASHBOARD_SESSION_SECRET' \
                                  -e SUPABASE_URL='$SUPABASE_URL' \
                                  -e SUPABASE_SERVICE_KEY='$SUPABASE_SERVICE_KEY' \
                                  -e HRIS_API_KEY='$HRIS_API_KEY' \
                                  -e HRIS_ALLOWED_ORIGINS='$HRIS_ALLOWED_ORIGINS' \
                                  -e HRIS_CLIENTS_B64='$HRIS_CLIENTS_B64' \
                                  -e HRIS_QUEUE_NAME=staging \
                                  -e HRIS_WORKER_ENABLED=${HRIS_WORKER_ENABLED:-true} \
                                  -e HRIS_WORKER_CONCURRENCY=${HRIS_WORKER_CONCURRENCY:-2} \
                                  -e APP_VERSION=$BUILD_NUMBER \
                                  -e VERCEL_GIT_COMMIT_SHA=$BUILD_NUMBER \
                                  $IMAGE_LATEST

                                docker logout ghcr.io
                                docker image prune -f
                            "
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            sh 'docker builder prune -f --filter "until=24h" || true'
        }
        success {
            echo "✅ #${BUILD_NUMBER} presentation-maker deployed to staging server successfully"
        }
        failure {
            echo "❌ #${BUILD_NUMBER} presentation-maker staging failed"
        }
    }
}
