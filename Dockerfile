FROM public.ecr.aws/lambda/nodejs:14
RUN yum install -y awscli wget
RUN wget https://download.asperasoft.com/download/sw/client/3.9.1/ibm-aspera-desktopclient-3.9.1.168302-linux-64.rpm
RUN yum localinstall -y ibm-aspera-desktopclient-3.9.1.168302-linux-64.rpm

COPY asperaDelivery.js ./

CMD ["asperaClient.handler"]