pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    // Required Jenkins credentials:
    //   ec2-deploy-ssh-key               SSH Username with private key — EC2 login
    //   OVERSEAS_PRIVATE_EC2_HOST        Secret text — EC2 host/IP
    //   GHCR_TOKEN                       Secret text — GitHub PAT with `write:packages`
    //                                    scope (same credential used by hris-backend)
    //   STG_PM_GOOGLE_SERVICE_ACCOUNT_EMAIL  Secret text
    //   STG_PM_GOOGLE_PRIVATE_KEY_B64    Secret text
    //   STG_PM_AUDIT_SHEET_ID            Secret text
    //   STG_PM_AUDIT_SHEET_TAB           Secret text (blank is fine — app defaults to "events")
    //   STG_PM_DASHBOARD_USERNAME        Secret text — overrides the hardcoded "admin"
    //   STG_PM_DASHBOARD_PASSWORD        Secret text — overrides the hardcoded "Whatis?"
    //   STG_PM_DASHBOARD_SESSION_SECRET  Secret text — signs the dashboard session cookie
    environment {
        REGISTRY     = 'ghcr.io/shomvob-tech/presentation-maker'
        GHCR_USER    = 'abrahimcse'                              // CONFIRM: same GHCR username as hris-backend?
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
                        string(credentialsId: 'STG_PM_DASHBOARD_USERNAME',          variable: 'DASHBOARD_USERNAME'),
                        string(credentialsId: 'STG_PM_DASHBOARD_PASSWORD',          variable: 'DASHBOARD_PASSWORD'),
                        string(credentialsId: 'STG_PM_DASHBOARD_SESSION_SECRET',    variable: 'DASHBOARD_SESSION_SECRET')
                    ]) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no ubuntu@$EC2_HOST \
                            "
                                echo '$GHCR_TOKEN' | docker login ghcr.io \
                                  -u $GHCR_USER --password-stdin

                                docker pull $IMAGE_LATEST

                                docker stop $CONTAINER 2>/dev/null || true
                                docker rm   $CONTAINER 2>/dev/null || true

                                docker run -d \
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
                                  -e DASHBOARD_USERNAME='$DASHBOARD_USERNAME' \
                                  -e DASHBOARD_PASSWORD='$DASHBOARD_PASSWORD' \
                                  -e DASHBOARD_SESSION_SECRET='$DASHBOARD_SESSION_SECRET' \
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
