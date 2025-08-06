// Admin Dashboard JavaScript
class SAuthAdmin {
  constructor() {
    this.clients = [];
    this.currentEditingClient = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadClients();
  }

  bindEvents() {
    // Add client button
    document.getElementById("addClientBtn").addEventListener("click", () => {
      this.showClientModal();
    });

    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadClients();
    });

    // Modal close buttons
    document.querySelectorAll(".close").forEach((closeBtn) => {
      closeBtn.addEventListener("click", (e) => {
        this.closeModal(e.target.closest(".modal"));
      });
    });

    // Cancel buttons
    document.getElementById("cancelBtn").addEventListener("click", () => {
      this.closeModal(document.getElementById("clientModal"));
    });

    document.getElementById("configCancelBtn").addEventListener("click", () => {
      this.closeModal(document.getElementById("configModal"));
    });

    // Form submissions
    document.getElementById("clientForm").addEventListener("submit", (e) => {
      this.handleClientSubmit(e);
    });

    document.getElementById("configForm").addEventListener("submit", (e) => {
      this.handleConfigSubmit(e);
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeModal(e.target);
      }
    });
  }

  async loadClients() {
    try {
      // For now, we'll simulate loading from localStorage
      // In a real app, this would be an API call
      const storedClients = localStorage.getItem("sauth_clients");
      this.clients = storedClients ? JSON.parse(storedClients) : [];
      this.renderClients();
    } catch (error) {
      console.error("Error loading clients:", error);
      this.showNotification("Error loading clients", "error");
    }
  }

  renderClients() {
    const clientsList = document.getElementById("clientsList");

    if (this.clients.length === 0) {
      clientsList.innerHTML = `
                <div class="empty-state">
                    <h3>No clients found</h3>
                    <p>Click "Add New Client" to create your first client</p>
                </div>
            `;
      return;
    }

    clientsList.style.display = "flex";
    clientsList.style.flexWrap = "wrap";
    clientsList.style.gap = "20px";
    clientsList.innerHTML = this.clients
      .map(
        (client) => `
            <div class="client-card" style="min-width:400px; flex:1 1 500px; box-sizing:border-box; margin-bottom:24px;">
                <div class="client-header">
                    <div class="client-name">${client.name}</div>
                    <div class="client-status ${
                      client.webhook_url ? "status-active" : "status-inactive"
                    }">
                        ${client.webhook_url ? "Configured" : "Pending Config"}
                    </div>
                </div>
                <div class="client-info">
                    <p><strong>Contact:</strong> ${client.contact || "N/A"}</p>
                    <p><strong>Created:</strong> ${new Date(
                      client.created_at
                    ).toLocaleDateString()}</p>
                    <p><strong>DataDome:</strong> ${
                      client.enable_datadome ? "Enabled" : "Disabled"
                    }</p>
                    <p><strong>Recaptcha:</strong> ${
                      client.enable_recaptcha ? "Enabled" : "Disabled"
                    }</p>
                    <p><strong>Webhook:</strong> ${
                      client.webhook_url || "Not set"
                    }</p>
                </div>
                <div class="client-credentials" style="font-size:1.1em; background:#f7fafc; padding:16px; border-radius:8px; margin:10px 0; word-break:break-all; max-width:480px; overflow-x:auto;">
                    <div style="margin-bottom:8px; white-space:pre-wrap;"><strong>Client ID:</strong> <span style="font-family:monospace;">${
                      client.client_id
                    }</span></div>
                    <div style="margin-bottom:8px; white-space:pre-wrap;"><strong>Client Secret:</strong> <span style="font-family:monospace;">${
                      client.client_secret || "N/A"
                    }</span></div>
                    <div style="white-space:pre-wrap;"><strong>API Key:</strong> <span style="font-family:monospace;">${
                      client.api_key || "N/A"
                    }</span></div>
                </div>
                <div class="client-actions">
                    <button class="btn btn-warning" onclick="admin.showConfigModal('${
                      client.client_id
                    }')">
                        Configure
                    </button>
                    <button class="btn btn-primary" onclick="admin.editClient('${
                      client.client_id
                    }')">
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="admin.deleteClient('${
                      client.client_id
                    }')">
                        Delete
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  showClientModal(clientId = null) {
    const modal = document.getElementById("clientModal");
    const title = document.getElementById("modalTitle");
    const form = document.getElementById("clientForm");

    if (clientId) {
      // Edit mode
      const client = this.clients.find((c) => c.client_id === clientId);
      if (!client) return;

      title.textContent = "Edit Client";
      document.getElementById("clientName").value = client.name;
      document.getElementById("clientContact").value = client.contact || "";
      document.getElementById("webhookUrl").value = client.webhook_url || "";
      document.getElementById("enableDatadome").checked =
        client.enable_datadome || false;
      document.getElementById("enableRecaptcha").checked =
        client.enable_recaptcha || false;
      this.currentEditingClient = clientId;
    } else {
      // Add mode
      title.textContent = "Add New Client";
      form.reset();
      this.currentEditingClient = null;
    }

    modal.style.display = "block";
  }

  showConfigModal(clientId) {
    const modal = document.getElementById("configModal");
    const client = this.clients.find((c) => c.client_id === clientId);

    if (client) {
      document.getElementById("configClientId").value = client.client_id;
      document.getElementById("configClientSecret").value =
        client.client_secret;
      document.getElementById("configWebhookUrl").value =
        client.webhook_url || "";
      document.getElementById("configEnableDatadome").checked =
        client.enable_datadome || false;
      document.getElementById("configEnableRecaptcha").checked =
        client.enable_recaptcha || false;
    }

    modal.style.display = "block";
  }

  closeModal(modal) {
    modal.style.display = "none";
  }

  async handleClientSubmit(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("clientName").value,
      contact: document.getElementById("clientContact").value,
      webhook_url: document.getElementById("webhookUrl").value,
      enable_datadome: document.getElementById("enableDatadome").checked,
      enable_recaptcha: document.getElementById("enableRecaptcha").checked,
    };

    try {
      if (this.currentEditingClient) {
        // Update existing client
        await this.updateClient(this.currentEditingClient, formData);
      } else {
        // Create new client
        await this.createClient(formData);
      }

      this.closeModal(document.getElementById("clientModal"));
      this.loadClients();
    } catch (error) {
      console.error("Error saving client:", error);
      this.showNotification("Error saving client", "error");
    }
  }

  async handleConfigSubmit(e) {
    e.preventDefault();

    const clientId = document.getElementById("configClientId").value;
    const clientSecret = document.getElementById("configClientSecret").value;
    const configData = {
      webhook_url: document.getElementById("configWebhookUrl").value,
      enable_datadome: document.getElementById("configEnableDatadome").checked,
      enable_recaptcha: document.getElementById("configEnableRecaptcha")
        .checked,
    };

    try {
      const response = await fetch("/client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          client_id: clientId,
          client_secret: clientSecret,
        },
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        // Update local storage
        const clientIndex = this.clients.findIndex(
          (c) => c.client_id === clientId
        );
        if (clientIndex !== -1) {
          this.clients[clientIndex] = {
            ...this.clients[clientIndex],
            ...configData,
          };
          localStorage.setItem("sauth_clients", JSON.stringify(this.clients));
        }

        this.showNotification("Configuration updated successfully", "success");
        this.closeModal(document.getElementById("configModal"));
        this.loadClients();
      } else {
        const error = await response.json();
        this.showNotification(error.error || "Configuration failed", "error");
      }
    } catch (error) {
      console.error("Error updating config:", error);
      this.showNotification("Error updating configuration", "error");
    }
  }

  async createClient(formData) {
    const response = await fetch("/client/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        contact: formData.contact,
        webhook_url: formData.webhook_url,
        enable_datadome: formData.enable_datadome,
        enable_recaptcha: formData.enable_recaptcha,
      }),
    });

    if (response.ok) {
      const newClient = await response.json();

      // Add additional fields from form
      const clientData = {
        ...newClient,
        name: formData.name,
        contact: formData.contact,
        webhook_url: formData.webhook_url,
        enable_datadome: formData.enable_datadome,
        enable_recaptcha: formData.enable_recaptcha,
        created_at: new Date().toISOString(),
      };

      this.clients.push(clientData);
      localStorage.setItem("sauth_clients", JSON.stringify(this.clients));

      // If config data provided, update config
      if (
        formData.webhook_url ||
        formData.enable_datadome ||
        formData.enable_recaptcha
      ) {
        await this.updateClientConfig(
          newClient.client_id,
          newClient.client_secret,
          {
            webhook_url: formData.webhook_url,
            enable_datadome: formData.enable_datadome,
            enable_recaptcha: formData.enable_recaptcha,
          }
        );
      }

      this.showNotification("Client created successfully", "success");
    } else {
      const error = await response.json();
      throw new Error(error.error || "Failed to create client");
    }
  }

  async updateClientConfig(clientId, clientSecret, configData) {
    const response = await fetch("/client/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        client_id: clientId,
        client_secret: clientSecret,
      },
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update config");
    }
  }

  editClient(clientId) {
    this.showClientModal(clientId);
  }

  deleteClient(clientId) {
    if (confirm("Are you sure you want to delete this client?")) {
      this.clients = this.clients.filter((c) => c.client_id !== clientId);
      localStorage.setItem("sauth_clients", JSON.stringify(this.clients));
      this.loadClients();
      this.showNotification("Client deleted successfully", "success");
    }
  }

  showNotification(message, type = "info") {
    // Simple notification - in a real app you'd want a proper notification system
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            background: ${
              type === "error"
                ? "#e53e3e"
                : type === "success"
                ? "#38a169"
                : "#4299e1"
            };
        `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
}

// Initialize admin when page loads
let admin;
document.addEventListener("DOMContentLoaded", () => {
  admin = new SAuthAdmin();
});
