.PHONY: help install validate deploy-dev deploy-staging deploy-prod export-dev export-staging export-prod users-dev users-staging users-prod clean

help:
	@echo "SubscribeHub Auth0 Deployment Make Targets"
	@echo "=========================================="
	@echo "install        - Install dependencies"
	@echo "validate       - Validate configurations"
	@echo "deploy-dev     - Deploy to development environment"
	@echo "deploy-staging - Deploy to staging environment"
	@echo "deploy-prod    - Deploy to production environment"
	@echo "export-dev     - Export current development configuration"
	@echo "export-staging - Export current staging configuration"
	@echo "export-prod    - Export current production configuration"
	@echo "users-dev      - Create test users in development"
	@echo "users-staging  - Create test users in staging"
	@echo "users-prod     - Create test users in production"
	@echo "clean          - Clean up generated files"

install:
	@echo "Installing dependencies..."
	npm install

validate:
	@echo "Validating configuration..."
	@node -e "const fs = require('fs'); const path = require('path'); const yaml = require('js-yaml'); \
	function validateYamlFiles(dirPath) { \
		const files = fs.readdirSync(dirPath); \
		files.forEach(file => { \
			const filePath = path.join(dirPath, file); \
			if (fs.statSync(filePath).isDirectory()) { \
				validateYamlFiles(filePath); \
			} else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) { \
				try { \
					const content = fs.readFileSync(filePath, 'utf8'); \
					yaml.load(content); \
					console.log('✓ Valid YAML: ' + filePath); \
				} catch (error) { \
					console.error('✗ Invalid YAML in ' + filePath + ': ' + error.message); \
					process.exit(1); \
				} \
			} \
		}); \
	} \
	validateYamlFiles('./shared'); \
	validateYamlFiles('./environments');"

deploy-dev: validate
	@echo "Deploying to development environment..."
	npm run deploy:dev

deploy-staging: validate
	@echo "Deploying to staging environment..."
	npm run deploy:staging

deploy-prod: validate
	@echo "Deploying to production environment..."
	@echo -n "Are you sure you want to deploy to PRODUCTION? [y/N] " && read ans && [ "$ans" = "y" ] && npm run deploy:prod

export-dev:
	@echo "Exporting development configuration..."
	npm run export:dev

export-staging:
	@echo "Exporting staging configuration..."
	npm run export:staging

export-prod:
	@echo "Exporting production configuration..."
	@echo -n "Are you sure you want to export from PRODUCTION? [y/N] " && read ans && [ "$ans" = "y" ] && npm run export:prod

users-dev:
	@echo "Creating test users in development environment..."
	npm run users:dev

users-staging:
	@echo "Creating test users in staging environment..."
	@echo -n "Are you sure you want to create test users in STAGING? [y/N] " && read ans && [ "$ans" = "y" ] && npm run users:staging

users-prod:
	@echo "Creating test users in production environment..."
	@echo -n "Are you sure you want to create test users in PRODUCTION? [y/N] " && read ans && [ "$ans" = "y" ] && npm run users:prod

clean:
	@echo "Cleaning up generated files..."
	rm -rf node_modules
	rm -rf export-dev export-staging export-prod
	find . -name "*.log" -type f -delete