FROM public.ecr.aws/lambda/nodejs:18 AS builder

#AWS APP COFNIG
#To download beforehand
# aws lambda get-layer-version-by-arn --region eu-central-1 --arn arn:aws:lambda:eu-central-1:066940009817:layer:AWS-AppConfig-Extension:91 | jq -r '.Content.Location' | xargs curl -o extension.zip
#COPY extension.zip extension.zip

RUN yum install -y unzip \
  && unzip extension.zip -d /opt \
  && rm -f extension.zip

FROM public.ecr.aws/lambda/nodejs:18
RUN yum install -y awscli wget

RUN wget https://ak-delivery04-mul.dhe.ibm.com/sar/CMA/OSA/0at7f/0/ibm-aspera-desktopclient-4.4.1.95-linux-64-release.rpm
RUN yum localinstall -y ibm-aspera-desktopclient-4.4.1.95-linux-64-release.rpm
COPY --from=builder /opt /opt

COPY asperaDelivery.js ./

CMD ["asperaClient.handler"]
