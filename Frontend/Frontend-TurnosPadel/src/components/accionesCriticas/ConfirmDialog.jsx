
const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm, 
  onCancel,
  type = "default" // "danger", "warning", "success"
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full mx-auto my-4 sm:my-8 shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
        </div>
        
        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-h-[70vh] overflow-y-auto">
          <div className="text-gray-600 text-sm sm:text-base">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button 
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 text-gray-700 hover:bg-gray-200 bg-white border-2 border-gray-300 rounded-lg transition-all font-semibold text-sm sm:text-base"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg transition-all font-semibold text-sm sm:text-base shadow-md hover:shadow-lg ${getButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;