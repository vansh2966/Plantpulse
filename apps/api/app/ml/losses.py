import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """
    Focal Loss for multi-class classification to address extreme class imbalance.
    Formula: -alpha * (1 - pt)^gamma * log(pt)
    """
    def __init__(self, gamma=2.0, alpha=None, reduction='mean'):
        """
        Args:
            gamma: Focusing parameter. High gamma makes the loss smaller for well-classified examples.
            alpha: 1D Tensor of class weights (optional).
            reduction: 'mean', 'sum', or 'none'.
        """
        super(FocalLoss, self).__init__()
        self.gamma = gamma
        self.alpha = alpha  
        self.reduction = reduction

    def forward(self, inputs, targets):
        """
        Args:
            inputs: (batch_size, num_classes) unnormalized logits
            targets: (batch_size,) integer class labels
        """
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        
        if self.alpha is not None:
            if self.alpha.device != inputs.device:
                self.alpha = self.alpha.to(inputs.device)
            alpha_weights = self.alpha[targets]
            focal_loss = focal_loss * alpha_weights
            
        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        else:
            return focal_loss
