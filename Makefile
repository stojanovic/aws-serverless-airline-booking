
##########################
# Bootstrapping variables
##########################

PIPENV ?= pipenv

export PYTHONUNBUFFERED := 1

target:
	$(info ${HELP_MESSAGE})
	@exit 0


all: init install build

install: ##=> Install all packages specified in Pipfile.lock
	$(info [*] Install required packages...)
	@$(PIPENV) sync

init: ##=> Install OS deps, python3.6 and dev tools
	$(info [*] Bootstrapping CI system...)
	@$(MAKE) _install_os_packages
	@$(MAKE) _install_dev_packages

build: ##=> Builds local artifacts using SAM CLI
	$(info [*] Building dependencies and artifacts...)

test: ##=> Run pytest
	$(info [*] Running tests...)

deploy: ##=> Deploy services
	$(info [*] Deploying...)

lint: ##=> Run code and infrastructure linters
	$(info [*] Running CloudFormation/SAM linter...)
	$(info [*] Running Code linter...)

ci: ##=> CI tasks before deploying
	$(MAKE) lint
	$(MAKE) build
	$(MAKE) test

deploy.booking: ##=> Deploy booking service using SAM
	$(info [*] Packaging and deploying Booking service...)
	pipenv shell && \
		cd src/backend/booking && \
		pipenv run sam package --s3-bucket $${DEPLOYMENT_BUCKET_NAME} --region $${AWS_REGION} && \
		pipenv run sam deploy \
			--template-file packaged.yaml \
			--stack-name $${STACK_NAME}-booking-$${AWS_BRANCH} \
			--capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
			--parameter-overrides BookingTable=$${BOOKING_TABLE_NAME} FlightTable=$${FLIGHT_TABLE_NAME} \
			--region $${AWS_REGION}


#############
#  Helpers  #
#############

_install_dev_packages:
	$(info [*] Installing development packages...)
	@$(PIPENV) sync --dev

_install_os_packages:
	$(info [*] Installing Python and OS deps...)
	yum install jq python36 python36-devel python36-pip gcc glibc-headers -y
	$(info [*] Upgrading Python PIP and installing Pipenv...)
	python36 -m pip install --upgrade pip
	python36 -m pip install pipenv

define HELP_MESSAGE
	Common usage:

	...::: Bootstraps environment with necessary tools like SAM and Pipenv :::...
	$ make init

	...::: Installs all required packages as per Pipfile.lock definition :::...
	$ make install

	...::: Build local artifacts using SAM CLI :::...
	$ make build
endef
