# Kairos - Custom Frappe Image
# Based on official Frappe image with Kairos app pre-installed

ARG FRAPPE_VERSION=v15
FROM frappe/frappe:${FRAPPE_VERSION}

# Metadata
LABEL maintainer="Fran Orzabal <franorzabal@gmail.com>"
LABEL org.opencontainers.image.title="Kairos"
LABEL org.opencontainers.image.description="School-parent communication platform"
LABEL org.opencontainers.image.source="https://github.com/franorzabal-hub/kairos-frappe"

# Switch to root for installation
USER root

# Install additional system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Add any additional packages here
    && rm -rf /var/lib/apt/lists/*

# Switch back to frappe user
USER frappe
WORKDIR /home/frappe/frappe-bench

# Copy Kairos app
COPY --chown=frappe:frappe ./kairos /home/frappe/frappe-bench/apps/kairos

# Install Kairos app dependencies
RUN cd /home/frappe/frappe-bench/apps/kairos \
    && /home/frappe/frappe-bench/env/bin/pip install -e .

# Add kairos to apps.txt for new sites
RUN echo "kairos" >> /home/frappe/frappe-bench/sites/apps.txt

# Build assets
RUN cd /home/frappe/frappe-bench \
    && /home/frappe/frappe-bench/env/bin/python -m frappe.utils.bench_helper frappe build --app kairos || true

# Default command (can be overridden)
CMD ["gunicorn", "--bind=0.0.0.0:8000", "--workers=4", "--threads=4", "--worker-class=gthread", "--timeout=120", "frappe.app:application"]
